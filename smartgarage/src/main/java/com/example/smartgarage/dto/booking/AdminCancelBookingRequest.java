package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCancelBookingRequest {
    @NotBlank(message = "cancelReason không được để trống")
    @Size(max=500, message="cancelReason không vượt quá 500 kí tự")
    private String  cancelReason;
}
