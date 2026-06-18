package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReassignMechanicRequest {
    @NotNull(message = "mechanicId không được để trống")
    private Long mechanicId;
}
