package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UpdateBookingRequest {
    private Long vehicleId;
    private Long branchId;
    private LocalDateTime arrivalSlotStart;
    private LocalDateTime arrivalSlotEnd;
    private List<Long> serviceIds;

    @Size(max = 1000, message = "Ghi chú không được quá 1000 ký tự")
    private String note;
}
