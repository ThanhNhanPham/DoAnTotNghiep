package com.example.smartgarage.service;

import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.entity.Service;
import com.example.smartgarage.enums.VehicleType;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.ConsultationHistoryRepository;
import com.example.smartgarage.repository.ServiceRepository;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AIService {
    private static final int MAX_ATTEMPTS = 2;
    private static final long INITIAL_BACKOFF_MS = 1000L;
    private static final long CACHE_TTL_MS = 10 * 60 * 1000L;
    private static final long SERVICE_LIST_CACHE_TTL_MS = 10 * 60 * 1000L;
    private static final long AI_FAILURE_COOLDOWN_MS = 30 * 1000L;
    private static final long USER_MIN_REQUEST_INTERVAL_MS = 3 * 1000L;
    private static final long USER_WINDOW_MS = 60 * 1000L;
    private static final int USER_MAX_REQUESTS_PER_WINDOW = 5;
    private static final int MAX_CONCURRENT_LOCAL_AI_REQUESTS = 4;

    @Value("${local-ai.base-url:http://localhost:11434}")
    private String localAiBaseUrl;

    @Value("${local-ai.model:qwen2.5:7b}")
    private String modelName;

    private final ServiceRepository serviceRepository;


    private final RestTemplate restTemplate;


    private final UserRepository userRepository;
    // Thêm Repository mới vào để lưu lịch sử
    private final ConsultationHistoryRepository historyRepository;
    private final ConcurrentHashMap<String, CacheEntry> responseCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<String>> inFlightRequests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UserRequestTracker> userRequestTrackers = new ConcurrentHashMap<>();
    private final Semaphore aiConcurrencyLimiter = new Semaphore(MAX_CONCURRENT_LOCAL_AI_REQUESTS);
    private final AtomicLong aiCooldownUntilMs = new AtomicLong(0L);
    private final ConcurrentHashMap<String, CacheEntry> serviceListCache = new ConcurrentHashMap<>();

    public AIService(ServiceRepository serviceRepository,
                     RestTemplate restTemplate,
                     UserRepository userRepository,
                     ConsultationHistoryRepository historyRepository) {
        this.serviceRepository = serviceRepository;
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    public String suggestService(String customerIssue, VehicleType vehicleType, String username) {
        String normalizedIssue = normalizeIssue(customerIssue);
        if (normalizedIssue.isBlank()) {
            return "Vui lòng nhập mô tả vấn đề của xe trước khi gửi yêu cầu.";
        }
        if (localAiBaseUrl == null || localAiBaseUrl.isBlank()) {
            return "Chưa cấu hình địa chỉ AI local cho hệ thống.";
        }
        String rateLimitMessage = validateUserRequestRate(username);
        if (rateLimitMessage != null) {
            return rateLimitMessage;
        }
        if (isAiCooldownActive()) {
            return "AI vừa chạm giới hạn tải, vui lòng thử lại sau khoảng 30 giây.";
        }

        String cacheKey = buildCacheKey(username, normalizedIssue, vehicleType);
        String cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse != null) {
            return cachedResponse;
        }

        CompletableFuture<String> newFuture = new CompletableFuture<>();
        CompletableFuture<String> existingFuture = inFlightRequests.putIfAbsent(cacheKey, newFuture);
        if (existingFuture != null) {
            return existingFuture.join();
        }

        try {
            String aiSuggestion = fetchSuggestionFromLocalAi(normalizedIssue, vehicleType, username);
            if (shouldCache(aiSuggestion)) {
                cacheResponse(cacheKey, aiSuggestion);
            }
            newFuture.complete(aiSuggestion);
            return aiSuggestion;
        } catch (RuntimeException runtimeException) {
            newFuture.completeExceptionally(runtimeException);
            throw runtimeException;
        } finally {
            inFlightRequests.remove(cacheKey, newFuture);
        }
    }

    private String fetchSuggestionFromLocalAi(String customerIssue, VehicleType vehicleType, String username) {
        if (!aiConcurrencyLimiter.tryAcquire()) {
            return "AI đang xử lý quá nhiều yêu cầu cùng lúc, vui lòng thử lại sau ít giây.";
        }
        try {
            String availableServices = getAvailableServicesForPrompt(vehicleType);
            String vehicleTypeLabel = toVehicleTypeLabel(vehicleType);
            String vehicleTypeInstruction = vehicleType != null
                    ? "Chỉ được phép đề xuất dịch vụ phù hợp với đúng loại xe này. "
                    : "Nếu chưa xác định chắc chắn loại xe, hãy nói rõ cần xác nhận xe là ô tô hay xe máy trước khi chốt dịch vụ. ";
            String serviceConstraintInstruction = vehicleType != null
                    ? "Danh sách dịch vụ hợp lệ của gara cho loại xe đó: [" + availableServices + "]. "
                    : "Danh sách dịch vụ hiện có của gara: [" + availableServices + "]. ";

            String finalUrl = buildLocalAiGenerateUrl();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String promptText = String.format(
                    "Bạn là cố vấn kỹ thuật của gara tại Việt Nam. Nhiệm vụ là tư vấn kỹ thuật có chiều sâu trước, rồi mới gợi ý dịch vụ sửa chữa/bảo dưỡng có trong hệ thống khi thật sự phù hợp. " +
                            "Loại xe khách đang sử dụng: %s. " +
                            "%s" +
                            "%s" +
                            "Mô tả của khách hàng: \"%s\". " +
                            "Luật ưu tiên 1: Nếu mô tả không liên quan đến xe, lỗi xe, bảo dưỡng xe, sửa chữa xe, phụ tùng xe, kiểm tra xe, sơn xe hoặc nhu cầu đặt lịch gara, hãy trả lời đúng 1 câu: \"Yêu cầu này chưa liên quan đến dịch vụ sửa chữa/bảo dưỡng xe. Vui lòng mô tả vấn đề xe của bạn để được tư vấn chính xác hơn.\" Không được gợi ý bất kỳ dịch vụ nào trong trường hợp này. " +
                            "Luật ưu tiên 2: Không trả lời chung chung kiểu 'có thể do nhiều nguyên nhân' nếu không nêu được nhóm nguyên nhân cụ thể gắn với triệu chứng khách mô tả. Phải bám sát từ khóa trong mô tả như tiếng kêu, rung, khó nổ, phanh, điều hòa, sơn cũ, muốn đổi màu, chết máy, hao xăng, lệch lái. " +
                            "Luật ưu tiên 3: Trước khi gợi ý dịch vụ, phải nêu nhận định kỹ thuật ngắn gọn theo đúng triệu chứng. Nếu khách mô tả thiếu dữ liệu, cần chỉ rõ còn thiếu gì như thời điểm xảy ra, vị trí phát ra, tần suất, dấu hiệu đi kèm. " +
                            "Luật ưu tiên 4: Chỉ chọn tối đa 2 dịch vụ phù hợp nhất từ danh sách hợp lệ khi triệu chứng có liên hệ rõ ràng với dịch vụ đó. Bắt buộc dùng đúng nguyên văn tên dịch vụ trong danh sách, không tự tạo, không đổi chữ, không thêm dịch vụ ngoài danh sách, không trộn dịch vụ của loại xe khác. " +
                            "Luật ưu tiên 5: Nếu khách đang hỏi theo hướng thẩm mỹ như sơn đã cũ, muốn màu mới, muốn xe đẹp hơn, muốn đổi phong cách, hãy hiểu đây là nhu cầu làm mới ngoại thất hoặc đổi màu, không tự suy diễn thành bảo dưỡng chung. Nếu danh sách có dịch vụ sơn phù hợp thì gợi ý đúng dịch vụ đó; nếu không có thì nói rõ gara chưa có dịch vụ phù hợp. " +
                            "Luật ưu tiên 6: Nếu chưa đủ thông tin để chốt dịch vụ, vẫn phải tư vấn có ích bằng cách nêu 2-4 khả năng hợp lý nhất hoặc hạng mục cần kiểm tra trước; sau đó mới hỏi thêm hoặc khuyên kiểm tra thực tế. Không được nhảy thẳng sang đặt lịch mà thiếu phần phân tích. " +
                            "Luật ưu tiên 7: Nếu không có dịch vụ nào phù hợp trong danh sách, trả lời rằng gara chưa có dịch vụ phù hợp và khuyên khách liên hệ nhân viên; không chọn dịch vụ thay thế mơ hồ. " +
                            "Định dạng trả lời: 3-5 câu tiếng Việt tự nhiên. Câu đầu tóm tắt nhận định bám sát triệu chứng. Câu thứ hai nêu 2-4 khả năng hoặc hạng mục cần kiểm tra, viết cụ thể chứ không mơ hồ. Nếu đủ căn cứ thì thêm câu 'Dịch vụ gợi ý: **Tên dịch vụ đúng nguyên văn**' hoặc tối đa 2 tên dịch vụ in đậm. Nếu chưa đủ dữ liệu, thêm 1 câu hỏi làm rõ ngắn gọn. Câu cuối chỉ nhắc kiểm tra tại gara khi thật sự cần. " +
                            "Không chẩn đoán chắc chắn lỗi, không báo giá ngoài hệ thống, không đề xuất tự sửa các hạng mục nguy hiểm. Tổng độ dài dưới 220 từ.",
                    vehicleTypeLabel, vehicleTypeInstruction, serviceConstraintInstruction, customerIssue
            );

            Map<String, Object> payload = Map.of(
                    "model", modelName,
                    "prompt", promptText,
                    "stream", false
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = null;
            for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    response = restTemplate.postForEntity(finalUrl, entity, Map.class);
                    break;
                } catch (HttpServerErrorException.ServiceUnavailable ex) {
                    triggerAiCooldown();
                    if (attempt == MAX_ATTEMPTS) {
                        return "AI đang quá tải tạm thời, vui lòng thử lại sau ít phút.";
                    }
                    sleepBeforeRetry(attempt);
                }
            }

            if (response.getBody() != null) {
                String aiSuggestion = Objects.toString(response.getBody().get("response"), "").trim();
                if (!aiSuggestion.isEmpty()) {
                    saveHistory(customerIssue, username, aiSuggestion);
                    return aiSuggestion;
                }
            }
            return "AI đã nhận được yêu cầu nhưng chưa tìm ra giải pháp tối ưu.";

        } catch (HttpClientErrorException e) {
            String errorDetail = e.getResponseBodyAsString();
            System.err.println("Chi tiết lỗi từ AI local: " + errorDetail);

            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                triggerAiCooldown();
                return "Hệ thống AI đang bận (Lỗi 429 - Hết hạn mức yêu cầu).";
            } else if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return "Lỗi 404: Model hoặc endpoint AI local không tồn tại. Hãy kiểm tra local-ai.model và local-ai.base-url.";
            }
            return "Lỗi kết nối AI: " + e.getStatusText();
        } catch (HttpServerErrorException e) {
            if (e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                triggerAiCooldown();
                return "AI đang quá tải tạm thời, vui lòng thử lại sau ít phút.";
            }
            return "Dịch vụ AI đang gặp sự cố tạm thời: " + e.getStatusText();
        } catch (CompletionException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return "Có lỗi xảy ra trong quá trình tư vấn AI: " + e.getMessage();
        } finally {
            aiConcurrencyLimiter.release();
        }
    }

    private String buildLocalAiGenerateUrl() {
        String normalizedBaseUrl = localAiBaseUrl.endsWith("/")
                ? localAiBaseUrl.substring(0, localAiBaseUrl.length() - 1)
                : localAiBaseUrl;
        return normalizedBaseUrl + "/api/generate";
    }

    private void saveHistory(String customerIssue, String username, String aiSuggestion) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng: " + username));

        ConsultationHistory history = new ConsultationHistory();
        history.setCustomerIssue(customerIssue);
        history.setAiSuggestion(aiSuggestion);
        history.setCustomer(user);
        history.setCreatedAt(LocalDateTime.now());
        historyRepository.save(history);
    }

    private String normalizeIssue(String customerIssue) {
        return customerIssue == null
                ? ""
                : customerIssue.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private String buildCacheKey(String username, String normalizedIssue, VehicleType vehicleType) {
        return username + "|" + normalizedIssue + "|" + (vehicleType != null ? vehicleType.name() : "UNKNOWN");
    }

    private String getCachedResponse(String cacheKey) {
        CacheEntry cacheEntry = responseCache.get(cacheKey);
        if (cacheEntry == null) {
            return null;
        }
        if (cacheEntry.expiresAt() < System.currentTimeMillis()) {
            responseCache.remove(cacheKey, cacheEntry);
            return null;
        }
        return cacheEntry.response();
    }

    private void cacheResponse(String cacheKey, String response) {
        responseCache.put(cacheKey, new CacheEntry(response, System.currentTimeMillis() + CACHE_TTL_MS));
    }

    private boolean shouldCache(String response) {
        return response != null
                && !response.isBlank()
                && !response.startsWith("Chưa cấu hình")
                && !response.startsWith("AI vừa chạm giới hạn tải")
                && !response.startsWith("AI đang xử lý quá nhiều yêu cầu")
                && !response.startsWith("Hệ thống AI đang bận")
                && !response.startsWith("AI đang quá tải")
                && !response.startsWith("Lỗi ")
                && !response.startsWith("Dịch vụ AI đang gặp sự cố")
                && !response.startsWith("Có lỗi xảy ra");
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            Thread.sleep(INITIAL_BACKOFF_MS * attempt);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry AI bị gián đoạn.", interruptedException);
        }
    }

    private String getAvailableServicesForPrompt(VehicleType vehicleType) {
        String cacheKey = vehicleType != null ? vehicleType.name() : "UNKNOWN";
        CacheEntry cacheEntry = serviceListCache.get(cacheKey);
        long now = System.currentTimeMillis();
        if (cacheEntry != null && cacheEntry.expiresAt() >= now) {
            return cacheEntry.response();
        }

        String availableServices = (vehicleType != null
                ? serviceRepository.findByIsActiveTrueAndType(vehicleType)
                : serviceRepository.findByIsActiveTrue()).stream()
                .map(Service::getName)
                .collect(Collectors.joining(", "));
        serviceListCache.put(cacheKey, new CacheEntry(availableServices, now + SERVICE_LIST_CACHE_TTL_MS));
        return availableServices;
    }

    private String toVehicleTypeLabel(VehicleType vehicleType) {
        if (vehicleType == null) {
            return "chưa xác định";
        }
        return switch (vehicleType) {
            case CAR -> "ô tô";
            case MOTORBIKE -> "xe máy";
        };
    }

    private String validateUserRequestRate(String username) {
        long now = System.currentTimeMillis();
        UserRequestTracker tracker = userRequestTrackers.computeIfAbsent(username, ignored -> new UserRequestTracker());
        synchronized (tracker) {
            if (tracker.lastRequestAt > 0 && now - tracker.lastRequestAt < USER_MIN_REQUEST_INTERVAL_MS) {
                return "Bạn gửi yêu cầu quá nhanh. Vui lòng chờ vài giây rồi thử lại.";
            }
            if (now - tracker.windowStartedAt >= USER_WINDOW_MS) {
                tracker.windowStartedAt = now;
                tracker.requestCount = 0;
            }
            if (tracker.requestCount >= USER_MAX_REQUESTS_PER_WINDOW) {
                return "Bạn đã dùng quá nhiều lượt tư vấn AI trong 1 phút. Vui lòng đợi rồi thử lại.";
            }
            tracker.lastRequestAt = now;
            tracker.requestCount++;
            return null;
        }
    }

    private boolean isAiCooldownActive() {
        return aiCooldownUntilMs.get() > System.currentTimeMillis();
    }

    private void triggerAiCooldown() {
        aiCooldownUntilMs.set(System.currentTimeMillis() + AI_FAILURE_COOLDOWN_MS);
    }

    private record CacheEntry(String response, long expiresAt) {
    }

    private static final class UserRequestTracker {
        private long windowStartedAt = System.currentTimeMillis();
        private long lastRequestAt;
        private int requestCount;
    }
}
