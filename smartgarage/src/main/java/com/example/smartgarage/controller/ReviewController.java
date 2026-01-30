package com.example.smartgarage.controller;

import com.example.smartgarage.dto.AdminReplyRequest;
import com.example.smartgarage.dto.ReviewRequest;
import com.example.smartgarage.entity.Review;
import com.example.smartgarage.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    private final ReviewService reviewService;
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @Operation(summary = "Gửi đánh giá mới", description = "Yêu cầu quyền ROLE_USER và đơn hàng phải COMPLETED")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> postReview(@RequestBody ReviewRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(reviewService.createReview(auth.getName(), request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy điểm đánh giá trung bình của thợ
    @GetMapping("/mechanic/{mechanicId}/average")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long mechanicId) {
        return ResponseEntity.ok(reviewService.getAverageRating(mechanicId));
    }
    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ Admin mới được phép gọi API này
    public ResponseEntity<?> replyToReview(@PathVariable Long id, @RequestBody AdminReplyRequest request) {
        try {
            Review updatedReview = reviewService.updateAdminReply(id, request.getReply());
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
