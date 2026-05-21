package com.example.smartgarage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;

    @Min(value = 1, message = "Số sao phải từ 1 đến 5")
    @Max(value = 5, message = "Số sao phải từ 1 đến 5")
    private int rating;

    @Size(max = 2000, message = "Nội dung đánh giá không được quá 2000 ký tự")
    private String comment;
}
