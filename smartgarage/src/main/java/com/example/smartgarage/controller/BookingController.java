package com.example.smartgarage.controller;

import com.example.smartgarage.dto.BookingHistoryDTO;
import com.example.smartgarage.dto.BookingRequest;
import com.example.smartgarage.dto.BookingResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Booking API", description = "Quản lý lịch hẹn sửa xe")
@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin("*")
@Validated
public class BookingController {

    private final BookingService bookingService;
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 1. API Đặt lịch mới: Lấy danh tính từ Token, không truyền userId qua URL
    @Operation(summary = "Đặt lịch sửa xe mới", description = "Khách hàng gửi thông tin xe và dịch vụ để đặt lịch")
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest bookingRequest,
                                                         Authentication authentication) {
        String currentEmail = authentication.getName();
        Booking createdBooking = bookingService.createBooking(currentEmail, bookingRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.mapToResponse(createdBooking));
    }

    @Operation(summary = "Xem lại lịch sử đặt lịch  ", description = "Khách hàng xem lại lịch sử đặt lịch của mình")
    @GetMapping("/my-history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<BookingHistoryDTO>> getMyBookings(Authentication authentication) {
        String email = authentication.getName();
        List<BookingHistoryDTO> history = bookingService.getMyBookings(email);
        return ResponseEntity.ok(history);
    }
    @Operation(summary = "Xem chi tiết lịch hẹn", description = "Khách hàng xem chi tiết một lịch hẹn cụ thể của mình")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id, Authentication authentication) {
        BookingResponse booking = bookingService.getBookingById(id, authentication.getName());
        return ResponseEntity.ok(booking);
    }

    @Operation(summary = "Hủy lịch hẹn", description = "Khách hàng hủy lịch hẹn của mình")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id, Authentication authentication) {
        bookingService.cancelBooking(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary="admin xác nhận lịch hẹn cho khách hàng")
    @PatchMapping("/{bookingId}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> confirm(@PathVariable Long bookingId, @RequestParam Long mechanicId) {
        BookingResponse confirmedBooking = bookingService.confirmBooking(bookingId, mechanicId);
        return ResponseEntity.ok(confirmedBooking);
    }


    @GetMapping({"/admin/all"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin xem toàn bộ lịch hẹn", description = "Có thể lọc theo status (PENDING, CONFIRMED...)")
    public ResponseEntity<List<BookingResponse>> getAllBookingsForAdmin(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(bookingService.getAllBookings(status));
    }

    @Operation(summary="Hoàn tất lịch hẹn cho khách hàng")
    @PatchMapping("/{bookingId}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> complete(@PathVariable Long bookingId) {
        BookingResponse completedBooking = bookingService.completeBooking(bookingId);
        return ResponseEntity.ok(completedBooking);
    }

    @Operation(summary="api admin thêm linh kiện vào đơn hàng")
    @PostMapping({"/{bookingId}/parts/{partId}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> addPartToBooking(@PathVariable Long bookingId,
                                                   @PathVariable Long partId,
                                                   @RequestParam @Min(1) int quantity) {
        bookingService.addPartToBooking(bookingId, partId, quantity);
        return ResponseEntity.ok("Đã thêm linh kiện vào đơn hàng thành công.");
    }
}
