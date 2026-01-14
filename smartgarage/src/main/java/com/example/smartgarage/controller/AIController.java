package com.example.smartgarage.controller;

import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.repository.ConsultationHistoryRepository;
import com.example.smartgarage.service.AIService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@Tag(name = "AI", description = "Quản lý lịch sử tư vấn và gợi ý từ AI")
@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @Autowired
    private ConsultationHistoryRepository consultationHistoryRepository;
    @GetMapping("/suggest")
    public ResponseEntity<String> getAiSuggestion(@RequestParam String issue) {
        try {
            String suggestion = aiService.suggestService(issue);
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