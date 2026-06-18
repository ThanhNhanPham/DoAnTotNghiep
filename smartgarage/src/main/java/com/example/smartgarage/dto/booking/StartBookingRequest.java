package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StartBookingRequest {
    @NotBlank(message = "Tình trạng xe trước khi sửa không được để trống")
    @Size(max = 2000, message = "Mô tả tình trạng xe không được vượt quá 2000 ký tự")
    private String vehicleConditionBeforeRepair;
}
