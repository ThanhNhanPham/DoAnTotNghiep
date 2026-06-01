package com.example.smartgarage.dto;

import com.example.smartgarage.enums.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIConsultationRequest {
    @NotBlank(message = "Mô tả lỗi không được để trống")
    private String issue;
    @NotNull(message = "Vui lòng bổ sung loại xe gửi khi gửi yêu cầu tư vấn")
    private VehicleType vehicleType;
}
