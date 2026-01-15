package com.example.smartgarage.controller;

import com.example.smartgarage.dto.BookingHistoryDTO;
import com.example.smartgarage.dto.BookingRequest;
import com.example.smartgarage.dto.BookingResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Booking", description = "Quản lý lịch hẹn sửa xe")
@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin("*")
public class BookingController {

    @Autowired
    private BookingService bookingService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookingRepository bookingRepository;

    // 1. API Đặt lịch mới: Lấy danh tính từ Token, không truyền userId qua URL
    @Operation(summary = "Đặt lịch sửa xe mới", description = "Khách hàng gửi thông tin xe và dịch vụ để đặt lịch")
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest bookingRequest,
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

    // 4. API Xác nhận lịch hẹn (Dành cho ADMIN/Nhân viên)
    @PatchMapping("/{bookingId}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long bookingId, @RequestParam Long mechanicId) {
        try {
            BookingResponse confirmedBooking = bookingService.confirmBooking(bookingId, mechanicId);
            return ResponseEntity.ok(confirmedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. API Hoàn thành việc sửa chữa (Dành cho ADMIN/Nhân viên)
    @GetMapping("/admin/all")
    @Operation(summary = "Admin xem toàn bộ lịch hẹn", description = "Có thể lọc theo status (PENDING, CONFIRMED...)")
    public ResponseEntity<?> getAllBookings(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(bookingService.getAllBookings(status));
    }

    @GetMapping("/admin/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings(null));
    }

    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<?> complete(@PathVariable Long bookingId) {
        try {
            BookingResponse completedBooking = bookingService.completeBooking(bookingId);
            return ResponseEntity.ok(completedBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // 6. API Thêm linh kiện vào đơn hàng (Dành cho ADMIN/Nhân viên)
    @PostMapping("/{bookingId}/addPart/{partId}")
    public ResponseEntity<String> addPartToBooking(@PathVariable Long bookingId, @PathVariable Long partId) {
        try {
            bookingService.addPartToBooking(bookingId, partId);
            return ResponseEntity.ok("Đã thêm linh kiện vào đơn hàng thành công.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}