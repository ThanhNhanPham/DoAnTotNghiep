package com.example.smartgarage.dto;

import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentProvider;
import com.example.smartgarage.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentStatusResponse {
    private Long bookingId;
    private PaymentMethod paymentMethod;
    private PaymentProvider provider;
    private PaymentStatus paymentStatus;
    private BigDecimal amount;
    private String orderId;
    private String requestId;
    private Long transId;
    private String payUrl;
    private String deeplink;
    private String qrCodeUrl;
    private String failureReason;
}
