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
public class DashboardOverviewDTO {
    private long totalBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long newBookingsToday;
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;
}
