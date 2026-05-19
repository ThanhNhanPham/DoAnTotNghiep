package com.example.smartgarage.controller;

import com.example.smartgarage.dto.booking.AvailableBookingSlotResponse;
import com.example.smartgarage.dto.booking.BookingRequest;
import com.example.smartgarage.dto.booking.BookingResponse;
import com.example.smartgarage.dto.booking.CustomerCancelBookingRequest;
import com.example.smartgarage.dto.booking.UpdateBookingRequest;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Booking API", description = "Quản lý lịch hẹn của khách hàng")
@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin("*")
@PreAuthorize("hasRole('CUSTOMER')")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Operation(summary = "Đặt lịch sửa xe mới")
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest bookingRequest,
                                                         Authentication authentication) {
        Booking createdBooking = bookingService.createBooking(authentication.getName(), bookingRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.mapToResponse(createdBooking));
    }

    @Operation(summary = "Xem danh sách booking của tôi")
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookingResponses(authentication.getName()));
    }

    @Operation(summary = "Xem chi tiết booking của tôi")
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(bookingService.getBookingById(id, authentication.getName()));
    }

    @Operation(summary = "Lấy danh sách khung giờ còn trống của chi nhánh trong ngày",
            description = "Dùng để khách hàng chọn khung giờ khi đặt lịch")
    @GetMapping("/available-slots")
    public ResponseEntity<AvailableBookingSlotResponse> getAvailableSlots(
            @RequestParam Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "60") @Min(30) @Max(240) int slotDurationMinutes,
            @RequestParam(defaultValue = "60") @Min(15) @Max(240) int slotIntervalMinutes) {
        return ResponseEntity.ok(
                bookingService.getAvailableSlots(branchId, date, slotDurationMinutes, slotIntervalMinutes)
        );
    }
    @Operation(summary = "Cập nhật booking khi còn chờ xử lý")
    @PatchMapping("/{id}")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id,
                                                         @Valid @RequestBody UpdateBookingRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(bookingService.updateBooking(id, authentication.getName(), request));
    }

    @Operation(summary = "Hủy booking của tôi")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id,
                                                         @Valid @RequestBody CustomerCancelBookingRequest request,
                                                         Authentication authentication) {
        bookingService.cancelBooking(id, authentication.getName(), request.getCancelReason());
        return ResponseEntity.ok(bookingService.getBookingById(id, authentication.getName()));
    }
}
