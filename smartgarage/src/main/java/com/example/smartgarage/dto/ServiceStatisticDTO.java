package com.example.smartgarage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServiceStatisticDTO {
    private String serviceName;
    private Long usageCount;
}
