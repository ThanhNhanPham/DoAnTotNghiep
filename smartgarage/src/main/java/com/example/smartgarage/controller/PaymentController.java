package com.example.smartgarage.controller;

import com.example.smartgarage.dto.PaymentStatusResponse;
import com.example.smartgarage.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Payment API", description = "Quản lý trạng thái thanh toán của booking")
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin("*")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(summary = "Admin xác nhận thanh toán tiền mặt", description = "Dùng khi khách thanh toán trực tiếp tại gara")
    @PostMapping("/cash/confirm/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PaymentStatusResponse> confirmCashPayment(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.confirmCashPayment(bookingId));
    }

    @Operation(summary = "Admin xác nhận thanh toán chuyển khoản", description = "Dùng khi gara xác nhận đã nhận được tiền chuyển khoản")
    @PostMapping("/bank-transfer/confirm/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PaymentStatusResponse> confirmBankTransferPayment(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.confirmBankTransferPayment(bookingId));
    }

    @Operation(summary = "Xem trạng thái thanh toán của booking")
    @GetMapping("/bookings/{bookingId}/status")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new RuntimeException("Bạn cần đăng nhập để xem trạng thái thanh toán.");
        }
        return ResponseEntity.ok(
                paymentService.getPaymentStatus(bookingId, authentication.getName())
        );
    }
}
