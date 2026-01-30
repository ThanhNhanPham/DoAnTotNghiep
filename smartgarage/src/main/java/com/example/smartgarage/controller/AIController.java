package com.example.smartgarage.controller;

import com.example.smartgarage.dto.AIConsultationRequest;
import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.repository.ConsultationHistoryRepository;
import com.example.smartgarage.service.AIService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@Tag(name = "AI", description = "Quản lý lịch sử tư vấn và gợi ý từ AI")
@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    private final AIService aiService;
    private final ConsultationHistoryRepository consultationHistoryRepository;

    public AIController(AIService aiService, ConsultationHistoryRepository consultationHistoryRepository) {
        this.aiService = aiService;
        this.consultationHistoryRepository = consultationHistoryRepository;
    }

    @PostMapping("/suggest")
    public ResponseEntity<?> getAiSuggestion(@Valid @RequestBody AIConsultationRequest request, Authentication auth) {
        try {
            if (request == null || request.getIssue() == null) {
                return ResponseEntity.badRequest().body("Dữ liệu gửi lên không hợp lệ");
            }
            String username = auth.getName();
            String suggestion = aiService.suggestService(request.getIssue(),username);
            return ResponseEntity.ok(suggestion);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi hệ thống: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<ConsultationHistory>> getAllHistory() {
        try {
            List<ConsultationHistory> histories = consultationHistoryRepository.findAllByOrderByCreatedAtDesc();
            if (histories.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}