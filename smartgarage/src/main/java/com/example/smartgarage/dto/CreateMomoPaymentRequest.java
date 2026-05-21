package com.example.smartgarage.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateMomoPaymentRequest {
    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;
}
