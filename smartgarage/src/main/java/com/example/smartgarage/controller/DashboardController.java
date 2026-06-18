package com.example.smartgarage.controller;

import com.example.smartgarage.dto.dashboard.DashboardOverviewDTO;
import com.example.smartgarage.dto.dashboard.RecentBookingDTO;
import com.example.smartgarage.dto.dashboard.RevenueSummaryDTO;
import com.example.smartgarage.dto.dashboard.RevenueTrendPointDTO;
import com.example.smartgarage.dto.ServiceStatisticDTO;
import com.example.smartgarage.dto.dashboard.StatusCountDTO;
import com.example.smartgarage.service.AdminScopeService;
import com.example.smartgarage.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    private final AdminScopeService adminScopeService;

    public DashboardController(DashboardService dashboardService, AdminScopeService adminScopeService) {
        this.dashboardService = dashboardService;
        this.adminScopeService = adminScopeService;
    }

    @Operation(summary = "Tổng quan KPI dashboard cho admin")
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDTO> getDashboardOverview(Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getDashboardOverview(branchScope));
    }

    @Operation(summary = "Thống kê booking theo trạng thái")
    @GetMapping("/bookings/status-distribution")
    public ResponseEntity<List<StatusCountDTO>> getBookingStatusDistribution(Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getBookingStatusDistribution(branchScope));
    }

    @Operation(summary = "Tóm tắt doanh thu theo kỳ hoặc khoảng ngày")
    @GetMapping("/revenue/summary")
    public ResponseEntity<RevenueSummaryDTO> getRevenueSummary(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getRevenueSummary(branchScope, period, from, to));
    }

    @Operation(summary = "Xu hướng doanh thu theo ngày hoặc tháng")
    @GetMapping("/revenue/trend")
    public ResponseEntity<List<RevenueTrendPointDTO>> getRevenueTrend(
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getRevenueTrend(branchScope, groupBy, from, to));
    }

    @Operation(summary = "Top dịch vụ được đặt nhiều nhất")
    @GetMapping("/services/top")
    public ResponseEntity<List<ServiceStatisticDTO>> getTopServices(
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getTopServices(branchScope, limit));
    }

    @Operation(summary = "Danh sách booking gần đây cho dashboard")
    @GetMapping("/bookings/recent")
    public ResponseEntity<List<RecentBookingDTO>> getRecentBookings(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        return ResponseEntity.ok(dashboardService.getRecentBookings(branchScope, limit));
    }
}
