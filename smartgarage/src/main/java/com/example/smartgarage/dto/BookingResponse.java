package com.example.smartgarage.dto;

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
public class BookingResponse {
    private Long id;
    private String status;
    private LocalDateTime bookingTime;
    private String customerName;
    private String customerPhone;
    private String bikeName; // VD: "Honda Sh 150i"
    private String licensePlate;
    private String branchName;
    private String mechanicName;
    private List<String> serviceNames;
    private List<String> partNames;
    private BigDecimal totalAmount;
}
