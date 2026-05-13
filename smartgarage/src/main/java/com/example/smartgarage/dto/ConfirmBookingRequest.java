package com.example.smartgarage.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmBookingRequest {
    @NotNull(message = "mechanicId không được để trống")
    private Long mechanicId;
}
