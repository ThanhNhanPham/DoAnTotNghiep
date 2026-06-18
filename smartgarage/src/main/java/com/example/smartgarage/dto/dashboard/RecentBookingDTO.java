package com.example.smartgarage.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentBookingDTO {
    private Long bookingId;
    private String customerName;
    private String customerPhone;
    private String vehicleName;
    private String licensePlate;
    private String branchName;
    private LocalDateTime bookingTime;
    private String status;
    private BigDecimal totalAmount;
    private String paymentStatus;
}
