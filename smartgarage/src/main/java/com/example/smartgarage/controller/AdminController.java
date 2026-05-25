package com.example.smartgarage.controller;

import com.example.smartgarage.dto.booking.BookingResponse;
import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.service.BookingService;
import com.example.smartgarage.service.MechanicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Các API quản lý dành cho Quản trị viên và Chủ Gara")
@CrossOrigin("*")
public class AdminController {

    private final BookingService bookingService;
    private final MechanicService mechanicService;

    public AdminController(BookingService bookingService, MechanicService mechanicService) {
        this.bookingService = bookingService;
        this.mechanicService = mechanicService;
    }

    @Operation(summary = "Lấy dữ liệu thống kê Dashboard", description = "Trả về số lượng đơn, doanh thu và top dịch vụ")
    @GetMapping("/status")
    public ResponseEntity<DashboardStatusDTO> getStatus() {
        DashboardStatusDTO status = bookingService.getDashboardStatus();
        return ResponseEntity.ok(status);
    }
    @Operation(summary = "Lấy danh sách thợ rảnh theo chi nhánh", description = "Dùng để Admin chọn thợ khi xác nhận lịch hẹn")
    @GetMapping("/mechanics/available/{branchId}")
    public ResponseEntity<List<Mechanic>> getAvailableMechanics(@PathVariable Long branchId) {
        List<Mechanic> mechanics= mechanicService.getAvailableByBranch(branchId);
        return ResponseEntity.ok(mechanics);
    }

//
//    @Operation(summary = "Hoàn thành lịch hẹn", description = "Chuyển trạng thái đơn sang COMPLETED và giải phóng thợ sửa xe")
//    @PutMapping("/bookings/{bookingId}/complete")
//    public ResponseEntity<?> completeBooking(@PathVariable Long bookingId) {
//        try {
//            BookingResponse completedBooking = bookingService.completeBooking(bookingId);
//            return ResponseEntity.ok(completedBooking);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }
//    @Operation(summary="Xuất danh sách booking ra file Excel và cho người dùng tải xuống")
//    @GetMapping("/bookings/export/excel")
//    public ResponseEntity<byte[]> exportToExcel() {
//        try {
//            byte[] excelContent = bookingService.exportBookingsToExcel();
//
//            return ResponseEntity.ok()
//                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bookings_report.xlsx")
//                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
//                    .body(excelContent);
//        } catch (IOException e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }

}
