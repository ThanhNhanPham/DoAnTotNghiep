package com.example.smartgarage.controller;

import com.example.smartgarage.dto.admin.AdminSearchResponseDTO;
import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.service.AdminSearchService;
import com.example.smartgarage.service.AdminScopeService;
import com.example.smartgarage.service.BookingService;
import com.example.smartgarage.service.MaintenanceReminderService;
import com.example.smartgarage.service.MechanicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
@Tag(name = "Admin", description = "Các API quản lý dành cho Quản trị viên và Chủ Gara")
@CrossOrigin("*")
public class AdminController {

    private final BookingService bookingService;
    private final MechanicService mechanicService;
    private final MaintenanceReminderService maintenanceReminderService;
    private final AdminSearchService adminSearchService;
    private final AdminScopeService adminScopeService;

    public AdminController(BookingService bookingService,
                           MechanicService mechanicService,
                           MaintenanceReminderService maintenanceReminderService,
                           AdminSearchService adminSearchService,
                           AdminScopeService adminScopeService) {
        this.bookingService = bookingService;
        this.mechanicService = mechanicService;
        this.maintenanceReminderService = maintenanceReminderService;
        this.adminSearchService = adminSearchService;
        this.adminScopeService = adminScopeService;
    }

    @Operation(summary = "Lấy dữ liệu thống kê Dashboard", description = "Trả về số lượng đơn, doanh thu và top dịch vụ")
    @GetMapping("/status")
    public ResponseEntity<DashboardStatusDTO> getStatus(Authentication authentication) {
        Long branchScope = adminScopeService.resolveBranchScope(authentication, null);
        DashboardStatusDTO status = bookingService.getDashboardStatus(branchScope);
        return ResponseEntity.ok(status);
    }
    @Operation(summary = "Lấy danh sách thợ rảnh theo chi nhánh", description = "Dùng để Admin chọn thợ khi xác nhận lịch hẹn")
    @GetMapping("/mechanics/available/{branchId}")
    public ResponseEntity<List<Mechanic>> getAvailableMechanics(@PathVariable Long branchId, Authentication authentication) {
        adminScopeService.ensureBranchAccess(authentication, branchId);
        List<Mechanic> mechanics= mechanicService.getAvailableByBranch(branchId);
        return ResponseEntity.ok(mechanics);
    }

    @Operation(summary = "Tìm kiếm nhanh khách hàng, lịch hẹn và hóa đơn cho thanh header")
    @GetMapping("/search")
    public ResponseEntity<AdminSearchResponseDTO> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(adminSearchService.search(keyword, limit));
    }

    @Operation(summary = "Gửi thử email nhắc bảo dưỡng cho một booking đã hoàn thành")
    @PostMapping("/maintenance-reminders/test/{bookingId}")
    public ResponseEntity<Map<String, String>> sendTestMaintenanceReminder(@PathVariable Long bookingId, Authentication authentication) {
        bookingService.assertBookingInBranch(bookingId, adminScopeService.resolveBranchScope(authentication, null));
        maintenanceReminderService.sendReminderForBookingId(bookingId);
        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi email nhắc bảo dưỡng thành công.",
                "bookingId", String.valueOf(bookingId)
        ));
    }


}
