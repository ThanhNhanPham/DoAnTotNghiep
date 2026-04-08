package com.example.smartgarage.controller;

import com.example.smartgarage.dto.BookingHistoryDTO;
import com.example.smartgarage.dto.BookingRequest;
import com.example.smartgarage.dto.BookingResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Booking API", description = "Quản lý lịch hẹn sửa xe")
@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin("*")
public class BookingController {

    private final BookingService bookingService;
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 1. API Đặt lịch mới: Lấy danh tính từ Token, không truyền userId qua URL
    @Operation(summary = "Đặt lịch sửa xe mới", description = "Khách hàng gửi thông tin xe và dịch vụ để đặt lịch")
    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest bookingRequest,
                                           Authentication authentication) {
        String currentEmail = authentication.getName();
        Booking createdBooking = bookingService.createBooking(currentEmail, bookingRequest);
        return ResponseEntity.ok(createdBooking);
    }

    // 2. API Xem lịch sử đặt lịch của CHÍNH khách hàng đang đăng nhập
    @Operation(summary = "Xem lại lịch sử đặt lịch  ", description = "Khách hàng xem lại lịch sử đặt lịch của mình")
    @GetMapping("/my-history")
    public ResponseEntity<List<BookingHistoryDTO>> getMyBookings(Authentication authentication) {
        // 1. Lấy email từ Token (đã được Filter giải mã và nạp vào Authentication)
        String email = authentication.getName();

        // 2. Gọi service xử lý
        List<BookingHistoryDTO> history = bookingService.getMyBookings(email);
        // 3. Trả về kết quả
        return ResponseEntity.ok(history);
    }
    // 3. API Hủy lịch hẹn: Phải kiểm tra đúng chủ sở hữu (Email)
    @Operation(summary = "Hủy lịch hẹn", description = "Khách hàng hủy lịch hẹn của mình")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, Authentication authentication) {
        try {
            bookingService.cancelBooking(id, authentication.getName());
            return ResponseEntity.ok("Đã hủy lịch hẹn thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary="admin xác nhận lịch hẹn cho khách hàng")
    @PatchMapping("/{bookingId}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirm(@PathVariable Long bookingId, @RequestParam Long mechanicId) {
        try {
            BookingResponse confirmedBooking = bookingService.confirmBooking(bookingId, mechanicId);
            return ResponseEntity.ok(confirmedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin xem toàn bộ lịch hẹn", description = "Có thể lọc theo status (PENDING, CONFIRMED...)")
    public ResponseEntity<?> getAllBookings(@RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(bookingService.getAllBookings(status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary="Admin xem toàn bộ lịch hẹn", description="không lọc theo filter")
    @GetMapping("/admin/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> results = bookingService.getAllBookings(null);
        return ResponseEntity.ok().body(results);
    }
    @Operation(summary="Xác nhận lịch hẹn cho khách hàng")
    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<?> complete(@PathVariable Long bookingId) {
        try {
            BookingResponse completedBooking = bookingService.completeBooking(bookingId);
            return ResponseEntity.ok(completedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary="api admin thêm linh kiện vào đơn hàng")
    @PostMapping("/{bookingId}/Part/{partId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> addPartToBooking(@PathVariable Long bookingId, @PathVariable Long partId, @RequestParam int quantity) {
        try {
            bookingService.addPartToBooking(bookingId, partId,quantity);
            return ResponseEntity.ok("Đã thêm linh kiện vào đơn hàng thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
