package com.example.smartgarage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIConsultationRequest {
    @NotBlank(message = "Mô tả lỗi không được để trống")
    private String issue;
}
