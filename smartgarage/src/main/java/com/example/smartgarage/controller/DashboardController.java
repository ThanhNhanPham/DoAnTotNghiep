package com.example.smartgarage.controller;

import com.example.smartgarage.dto.dashboard.DashboardOverviewDTO;
import com.example.smartgarage.dto.dashboard.RecentBookingDTO;
import com.example.smartgarage.dto.dashboard.RevenueSummaryDTO;
import com.example.smartgarage.dto.dashboard.RevenueTrendPointDTO;
import com.example.smartgarage.dto.ServiceStatisticDTO;
import com.example.smartgarage.dto.dashboard.StatusCountDTO;
import com.example.smartgarage.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Dashboard API", description = "Quản lý Dashboard")
@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Tổng quan KPI dashboard cho admin")
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDTO> getDashboardOverview() {
        return ResponseEntity.ok(dashboardService.getDashboardOverview());
    }

    @Operation(summary = "Thống kê booking theo trạng thái")
    @GetMapping("/bookings/status-distribution")
    public ResponseEntity<List<StatusCountDTO>> getBookingStatusDistribution() {
        return ResponseEntity.ok(dashboardService.getBookingStatusDistribution());
    }

    @Operation(summary = "Tóm tắt doanh thu theo kỳ hoặc khoảng ngày")
    @GetMapping("/revenue/summary")
    public ResponseEntity<RevenueSummaryDTO> getRevenueSummary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getRevenueSummary(period, from, to));
    }

    @Operation(summary = "Xu hướng doanh thu theo ngày hoặc tháng")
    @GetMapping("/revenue/trend")
    public ResponseEntity<List<RevenueTrendPointDTO>> getRevenueTrend(
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        return ResponseEntity.ok(dashboardService.getRevenueTrend(groupBy, from, to));
    }

    @Operation(summary = "Top dịch vụ được đặt nhiều nhất")
    @GetMapping("/services/top")
    public ResponseEntity<List<ServiceStatisticDTO>> getTopServices(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(dashboardService.getTopServices(limit));
    }

    @Operation(summary = "Danh sách booking gần đây cho dashboard")
    @GetMapping("/bookings/recent")
    public ResponseEntity<List<RecentBookingDTO>> getRecentBookings(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentBookings(limit));
    }
}
