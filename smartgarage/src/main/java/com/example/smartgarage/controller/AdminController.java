package com.example.smartgarage.controller;

import com.example.smartgarage.dto.BookingResponse;
import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.service.BookingService;
import com.example.smartgarage.service.MechanicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
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

    @Operation(summary = "Xem tất cả lịch hẹn", description = "Có thể lọc theo trạng thái: PENDING, CONFIRMED, COMPLETED, CANCELLED")
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings(@RequestParam(required = false) String status) {
        List<BookingResponse> results=bookingService.getAllBookings(status);
        return ResponseEntity.ok().body(results);
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

    @Operation(summary = "Xác nhận lịch hẹn và gán thợ", description = "Chuyển trạng thái đơn sang CONFIRMED và gán thợ thực hiện")
    @PutMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long bookingId, @RequestParam Long mechanicId) {
        try {
            BookingResponse confirmedBooking = bookingService.confirmBooking(bookingId, mechanicId);
            return ResponseEntity.ok(confirmedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Hoàn thành lịch hẹn", description = "Chuyển trạng thái đơn sang COMPLETED và giải phóng thợ sửa xe")
    @PutMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable Long bookingId) {
        try {
            BookingResponse completedBooking = bookingService.completeBooking(bookingId);
            return ResponseEntity.ok(completedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @Operation(summary="Xuất danh sách booking ra file Excel và cho người dùng tải xuống")
    @GetMapping("/bookings/export/excel")
    public ResponseEntity<byte[]> exportToExcel() {
        try {
            byte[] excelContent = bookingService.exportBookingsToExcel();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bookings_report.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelContent);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @Operation(summary="xuất hoá đơn ra file word")
    @GetMapping("/bookings/{id}/export/word")
    public ResponseEntity<byte[]> exportInvoice(@PathVariable Long id) {
        try {
            byte[] wordContent = bookingService.exportInvoiceWord(id);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=hoa_don_" + id + ".docx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.valueOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                    .body(wordContent);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
