package com.example.smartgarage.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryDTO {
    private String period;
    private String from;
    private String to;
    private BigDecimal revenue;
    private long completedBookings;
    private BigDecimal averageOrderValue;
}
