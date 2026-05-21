package com.example.smartgarage.service;

import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.entity.Service;
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
    private volatile CacheEntry serviceListCache;

    public AIService(ServiceRepository serviceRepository,
                     RestTemplate restTemplate,
                     UserRepository userRepository,
                     ConsultationHistoryRepository historyRepository) {
        this.serviceRepository = serviceRepository;
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    public String suggestService(String customerIssue, String username) {
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

        String cacheKey = buildCacheKey(username, normalizedIssue);
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
            String aiSuggestion = fetchSuggestionFromLocalAi(normalizedIssue, username);
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

    private String fetchSuggestionFromLocalAi(String customerIssue, String username) {
        if (!aiConcurrencyLimiter.tryAcquire()) {
            return "AI đang xử lý quá nhiều yêu cầu cùng lúc, vui lòng thử lại sau ít giây.";
        }
        try {
            String availableServices = getAvailableServicesForPrompt();

            String finalUrl = buildLocalAiGenerateUrl();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String promptText = String.format(
                    "Bạn là chuyên gia tư vấn sửa chữa xe máy tại Việt Nam. " +
                            "Gara của tôi có các dịch vụ: [%s]. " +
                            "Khách hàng nói: '%s'. " +
                            "Hãy phân tích lỗi và gợi ý dịch vụ phù hợp nhất. " +
                            " Tên dịch vụ được đề xuất phải được bọc bằng Markdown in đậm theo dạng **tên dịch vụ**. " +
                            "Trả về kết quả thân thiện, ngắn gọn dưới 100 từ.",
                    availableServices, customerIssue
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

    private String buildCacheKey(String username, String normalizedIssue) {
        return username + "|" + normalizedIssue;
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

    private String getAvailableServicesForPrompt() {
        CacheEntry cacheEntry = serviceListCache;
        long now = System.currentTimeMillis();
        if (cacheEntry != null && cacheEntry.expiresAt() >= now) {
            return cacheEntry.response();
        }

        String availableServices = serviceRepository.findAll().stream()
                .map(Service::getName)
                .collect(Collectors.joining(", "));
        serviceListCache = new CacheEntry(availableServices, now + SERVICE_LIST_CACHE_TTL_MS);
        return availableServices;
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
