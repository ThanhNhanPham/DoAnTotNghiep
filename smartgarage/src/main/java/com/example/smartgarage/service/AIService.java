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
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String modelName;

    private final ServiceRepository serviceRepository;


    private final RestTemplate restTemplate;


    private final UserRepository userRepository;
    // Thêm Repository mới vào để lưu lịch sử
    private final ConsultationHistoryRepository historyRepository;
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
        try {
            // 1. Lấy danh sách dịch vụ thực tế từ DB
            String availableServices = serviceRepository.findAll().stream()
                    .map(Service::getName)
                    .collect(Collectors.joining(", "));

            // 2. Tạo URL chuẩn xác (Sử dụng model 2.5 Flash để tránh lỗi 404)
            // Sử dụng v1 cho các bản Stable năm 2026 (như Gemini 2.5 Flash)
            String BASE_URL = "https://generativelanguage.googleapis.com/v1/models/";
            String finalUrl = BASE_URL + modelName + ":generateContent?key=" + apiKey;

            // 3. Thiết lập Header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 4. Tạo Prompt
            String promptText = String.format(
                    "Bạn là chuyên gia tư vấn sửa chữa xe máy tại Việt Nam. " +
                            "Gara của tôi có các dịch vụ: [%s]. " +
                            "Khách hàng nói: '%s'. " +
                            "Hãy phân tích lỗi và gợi ý dịch vụ phù hợp nhất. Trả về kết quả thân thiện, ngắn gọn dưới 100 từ.",
                    availableServices, customerIssue
            );

            // 5. Cấu trúc JSON Body
            Map<String, Object> payload = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", promptText)))
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            // 6. Gọi API Google (Hạn mức 15 lần/phút cho gói Free)
            ResponseEntity<Map> response = restTemplate.postForEntity(finalUrl, entity, Map.class);

            // 7. Bóc tách dữ liệu và LƯU LỊCH SỬ
            if (response.getBody() != null && response.getBody().containsKey("candidates")) {
                List<?> candidates = (List<?>) response.getBody().get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> firstCandidate = (Map<?, ?>) candidates.getFirst();
                    Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
                    List<?> parts = (List<?>) content.get("parts");
                    Map<?, ?> firstPart = (Map<?, ?>) parts.getFirst();

                    String aiSuggestion = (String) firstPart.get("text");
                    User user = userRepository.findByEmail(username)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng: " + username));
                    // --- BƯỚC MỚI: LƯU VÀO DATABASE ---
                    ConsultationHistory history = new ConsultationHistory();
                    history.setCustomerIssue(customerIssue);
                    history.setAiSuggestion(aiSuggestion);
                    history.setCustomer(user);
                    history.setCreatedAt(LocalDateTime.now());
                    historyRepository.save(history);

                    return aiSuggestion;
                }
            }
            return "AI đã nhận được yêu cầu nhưng chưa tìm ra giải pháp tối ưu.";

        } catch (HttpClientErrorException e) {
            String errorDetail = e.getResponseBodyAsString();
            System.err.println("Chi tiết lỗi từ Google: " + errorDetail);

            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                return "Hệ thống AI đang bận (Lỗi 429 - Hết hạn mức 1,500 yêu cầu/ngày).";
            } else if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return "Lỗi 404: Model không tồn tại. Hãy dùng Gemini 2.5 Flash.";
            }
            return "Lỗi kết nối AI: " + e.getStatusText();
        } catch (Exception e) {
            e.printStackTrace();
            return "Có lỗi xảy ra trong quá trình tư vấn AI: " + e.getMessage();
        }
    }
}
