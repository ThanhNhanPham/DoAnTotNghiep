package com.example.smartgarage.dto.part;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PartRequest(
        @NotBlank(message = "Tên linh kiện không được để trống")
        @Size(min = 2, max = 100, message = "Tên linh kiện phải từ 2 đến 100 ký tự")
        String name,

        String description,

        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá linh kiện phải lớn hơn 0")
        BigDecimal price,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 0, message = "Số lượng tồn kho không được nhỏ hơn 0")
        Integer quantity,

        @NotBlank(message = "Đơn vị tính không được để trống")
        String unit
) {
}
