package com.example.smartgarage.controller;

import com.example.smartgarage.dto.AdminReplyRequest;
import com.example.smartgarage.dto.ReviewRequest;
import com.example.smartgarage.dto.ReviewSummaryResponse;
import com.example.smartgarage.entity.Review;
import com.example.smartgarage.service.ReviewService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Review API", description = "Quản lý đánh giá")
@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin("*")
public class ReviewController {
    private final ReviewService reviewService;
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @Operation(summary = "Gửi đánh giá mới", description = "Yêu cầu quyền ROLE_CUSTOMER và đơn hàng phải COMPLETED")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Review> postReview(@Valid @RequestBody ReviewRequest request, Authentication auth) {
        return ResponseEntity.ok(reviewService.createReview(auth.getName(), request));
    }

    @Operation(summary = "Lấy đánh giá của một đơn hàng")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<Review> getReviewByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reviewService.getReviewByBooking(bookingId));
    }

    @Operation(summary = "Lấy danh sách đánh giá chung của gara")
    @GetMapping
    public ResponseEntity<Page<Review>> getReviews(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviews(page, size));
    }

    @Operation(summary = "Lấy tổng quan đánh giá chung của gara")
    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryResponse> getReviewSummary() {
        return ResponseEntity.ok(reviewService.getReviewSummary());
    }

    @Operation(summary="Admin trả lời đánh giá")
    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Review> replyToReview(@PathVariable Long id, @Valid @RequestBody AdminReplyRequest request) {
        Review updatedReview = reviewService.updateAdminReply(id, request.getReply());
        return ResponseEntity.ok(updatedReview);
    }
}
