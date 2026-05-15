package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerCancelBookingRequest {
    @NotBlank(message = "cancelReason không được để trống")
    @Size(max = 500, message = "cancelReason không được vượt quá 500 ký tự")
    private String cancelReason;
}
