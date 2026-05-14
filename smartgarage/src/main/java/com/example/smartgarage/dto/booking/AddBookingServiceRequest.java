package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddBookingServiceRequest {
    @NotNull(message = "serviceId không được để trống")
    private Long serviceId;
}
