package com.example.smartgarage.controller;

import com.example.smartgarage.dto.AIConsultationRequest;
import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.service.AIService;
import com.example.smartgarage.service.ConsultationHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@Tag(name = "AI API", description = "Quản lý lịch sử tư vấn và gợi ý từ AI")
@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    private final AIService aiService;
    private final ConsultationHistoryService consultationHistoryService;

    public AIController(AIService aiService, ConsultationHistoryService consultationHistoryService) {
        this.aiService = aiService;
        this.consultationHistoryService = consultationHistoryService;
    }
    @Operation(summary="AI gợi ý dịch vụ cho khách hàng")
    @PostMapping("/suggest")
    public ResponseEntity<?> getAiSuggestion(@Valid @RequestBody AIConsultationRequest request, Authentication auth) {
        try {
            if (request == null || request.getIssue() == null) {
                return ResponseEntity.badRequest().body("Dữ liệu gửi lên không hợp lệ");
            }
            String username = auth.getName();
            String suggestion = aiService.suggestService(request.getIssue(), request.getVehicleType(), username);
            return ResponseEntity.ok(suggestion);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi hệ thống: " + e.getMessage());
        }
    }

    @Operation(summary="lấy lịch sủ truy vấn Ai của ngừoi dùng")
    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ConsultationHistory>> getAllHistory() {
        try {
            List<ConsultationHistory> histories = consultationHistoryService.findAllByOrderByCreatedAtDesc();
            if (histories.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Lấy lịch sử truy vấn AI của user đang đăng nhập")
    @GetMapping("/history/me")
    public ResponseEntity<List<ConsultationHistory>> getMyHistory(Authentication auth) {
        try {
            String username = auth.getName();
            List<ConsultationHistory> histories =
                    consultationHistoryService.findByCustomerEmailOrderByCreatedAtDesc(username);
            if (histories.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Xóa lịch sử truy vấn AI của user đang đăng nhập theo id")
    @DeleteMapping("/history/{id}/me")
    public ResponseEntity<String> deleteMyHistory(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        consultationHistoryService.deleteMyHistoryById(id, username);
        return ResponseEntity.ok("Lịch sử truy vấn của bạn được xóa thành công.");
    }
}
