package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddBookingPartRequest {
    @NotNull(message = "partId không được để trống")
    private Long partId;

    @NotNull(message = "quantity không được để trống")
    @Min(value = 1, message = "quantity phải lớn hơn hoặc bằng 1")
    private Integer quantity;
}
