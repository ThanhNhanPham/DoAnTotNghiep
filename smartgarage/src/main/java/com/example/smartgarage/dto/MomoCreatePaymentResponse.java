package com.example.smartgarage.dto;

import com.example.smartgarage.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MomoCreatePaymentResponse {
    private Long bookingId;
    private String orderId;
    private String requestId;
    private Integer resultCode;
    private String message;
    private String payUrl;
    private String deeplink;
    private String qrCodeUrl;
    private PaymentStatus paymentStatus;
}
