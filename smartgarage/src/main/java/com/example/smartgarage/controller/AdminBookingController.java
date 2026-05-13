package com.example.smartgarage.controller;

import com.example.smartgarage.dto.booking.AddBookingPartRequest;
import com.example.smartgarage.dto.booking.BookingResponse;
import com.example.smartgarage.dto.ConfirmBookingRequest;
import com.example.smartgarage.dto.booking.UpdateBookingPartRequest;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin Booking API", description = "Quản lý lịch hẹn phía quản trị")
@RestController
@RequestMapping("/api/v1/admin/bookings")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Operation(summary = "Admin xem toàn bộ lịch hẹn", description = "Có thể lọc theo status như: PENDING, CONFIRMED, COMPLETED, CANCELLED")
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(bookingService.getAllBookings(status));
    }

    @Operation(summary = "Admin xem chi tiết lịch hẹn")
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingByIdForAdmin(id));
    }

    @Operation(summary = "Admin xác nhận lịch hẹn và gán thợ")
    @PatchMapping("/{bookingId}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable Long bookingId,
                                                          @Valid @RequestBody ConfirmBookingRequest request) {
        return ResponseEntity.ok(bookingService.confirmBooking(bookingId, request.getMechanicId()));
    }

    @Operation(summary = "Admin hoàn tất lịch hẹn")
    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.completeBooking(bookingId));
    }

    @Operation(summary = "Admin hủy lịch hẹn")
    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.cancelBookingForAdmin(bookingId));
    }

    @Operation(summary = "Admin thêm linh kiện vào booking")
    @PostMapping("/{bookingId}/parts")
    public ResponseEntity<BookingResponse> addPart(@PathVariable Long bookingId,
                                                   @Valid @RequestBody AddBookingPartRequest request) {
        return ResponseEntity.ok(bookingService.addPartToBooking(bookingId, request.getPartId(), request.getQuantity()));
    }

    @Operation(summary = "Admin cập nhật số lượng linh kiện trong booking")
    @PatchMapping("/{bookingId}/parts/{partId}")
    public ResponseEntity<BookingResponse> updatePart(@PathVariable Long bookingId,
                                                      @PathVariable Long partId,
                                                      @Valid @RequestBody UpdateBookingPartRequest request) {
        return ResponseEntity.ok(bookingService.updateBookingPart(bookingId, partId, request.getQuantity()));
    }

    @Operation(summary = "Admin xóa linh kiện khỏi booking")
    @DeleteMapping("/{bookingId}/parts/{partId}")
    public ResponseEntity<BookingResponse> removePart(@PathVariable Long bookingId,
                                                      @PathVariable Long partId) {
        return ResponseEntity.ok(bookingService.removeBookingPart(bookingId, partId));
    }
}
