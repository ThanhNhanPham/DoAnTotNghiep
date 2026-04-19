package com.example.smartgarage.dto;

import com.example.smartgarage.enums.BookingStatus;
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
public class BookingResponse {
    private Long id;
    private BookingStatus status;
    private LocalDateTime bookingTime;
    private LocalDateTime arrivalSlotStart;
    private LocalDateTime arrivalSlotEnd;
    private LocalDateTime arrivalTime;
    private String customerName;
    private String vehicleOwnerName;
    private String customerPhone;
    private String vehicleName; // VD: "Honda Sh 150i"
    private String licensePlate;
    private String branchName;
    private String mechanicName;
    private List<String> serviceNames;
    private List<String> partNames;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
}
