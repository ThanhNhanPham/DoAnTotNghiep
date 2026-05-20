package com.example.smartgarage.controller;

import com.example.smartgarage.dto.CreateMomoPaymentRequest;
import com.example.smartgarage.dto.MomoCreatePaymentResponse;
import com.example.smartgarage.dto.MomoIpnRequest;
import com.example.smartgarage.dto.PaymentStatusResponse;
import com.example.smartgarage.service.MomoPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Payment API", description = "Thanh toán trực tuyến qua MoMo")
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin("*")
public class PaymentController {
    private final MomoPaymentService momoPaymentService;

    public PaymentController(MomoPaymentService momoPaymentService) {
        this.momoPaymentService = momoPaymentService;
    }

    @Operation(summary = "Tạo link thanh toán MoMo cho booking")
    @PostMapping("/momo/create")
    public ResponseEntity<MomoCreatePaymentResponse> createMomoPayment(
            @Valid @RequestBody CreateMomoPaymentRequest request,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new RuntimeException("Bạn cần đăng nhập để tạo " + "thanh toán MoMo.");
        }
        return ResponseEntity.ok(
                momoPaymentService.createPayment(request.getBookingId(), authentication.getName())
        );
    }

    @Operation(summary = "IPN callback từ MoMo", description = "MoMo gọi server-to-server để cập nhật trạng thái thanh toán")
    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> handleMomoIpn(@RequestBody MomoIpnRequest request) {
        momoPaymentService.handleIpn(request);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mock xác nhận thanh toán MoMo", description = "Dùng cho demo sandbox khi không nhận IPN thật")
    @PostMapping("/momo/mock-confirm/{bookingId}")
    public ResponseEntity<PaymentStatusResponse> mockConfirmMomoPayment(
            @PathVariable Long bookingId,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new RuntimeException("Bạn cần đăng nhập để xác nhận thanh toán MoMo.");
        }
        return ResponseEntity.ok(
                momoPaymentService.mockConfirmPayment(bookingId, authentication.getName())
        );
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
                momoPaymentService.getPaymentStatus(bookingId, authentication.getName())
        );
    }
}
