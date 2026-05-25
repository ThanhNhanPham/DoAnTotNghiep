package com.example.smartgarage.dto;

import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentStatusResponse {
    private Long bookingId;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private BigDecimal amount;
}
