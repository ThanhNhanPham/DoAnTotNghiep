package com.example.smartgarage.dto;

import com.example.smartgarage.enums.MembershipTier;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long invoiceId;
    private String invoiceNumber;
    private Long bookingId;
    private String customerName;
    private String customerPhone;
    private String licensePlate;
    private String mechanicName;
    private List<String> serviceNames;
    private BigDecimal serviceAmount;
    private BigDecimal partAmount;
    private MembershipTier membershipTier;
    private BigDecimal membershipDiscountRate;
    private BigDecimal membershipDiscountAmount;
    private BigDecimal finalAmount;
    private Integer pointsEarned;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private LocalDateTime issuedAt;
    private String note;
}
