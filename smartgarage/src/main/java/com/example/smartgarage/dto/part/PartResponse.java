package com.example.smartgarage.dto.part;

import java.math.BigDecimal;

public record PartResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer quantity,
        String unit,
        Long branchId,
        String branchName
) {
}
