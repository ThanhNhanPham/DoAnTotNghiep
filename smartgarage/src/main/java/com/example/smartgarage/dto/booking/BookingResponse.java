package com.example.smartgarage.dto.booking;

import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.MembershipTier;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.enums.VehicleType;
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
    private LocalDateTime createdAt;
    private LocalDateTime bookingTime;
    private LocalDateTime arrivalSlotStart;
    private LocalDateTime arrivalSlotEnd;
    private LocalDateTime arrivalTime;
    private LocalDateTime repairStartTime;
    private LocalDateTime repairEndTime;
    private String customerName;
    private String vehicleOwnerName;
    private String customerPhone;
    private Long vehicleId;
    private String vehicleName; // VD: "Honda Sh 150i"
    private VehicleType vehicleType;
    private String vehicleImageUrl;
    private String licensePlate;
    private Long branchId;
    private String branchName;
    private String mechanicName;
    private List<Long> serviceIds;
    private List<String> serviceNames;
    private List<String> partNames;
    private String note;
    private String cancelReason;
    private String vehicleConditionBeforeRepair;
    private BigDecimal serviceAmount;
    private BigDecimal partAmount;
    private MembershipTier membershipTierApplied;
    private BigDecimal membershipDiscountRate;
    private BigDecimal membershipDiscountAmount;
    private Integer pointsEarned;
    private BigDecimal finalAmount;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
}
