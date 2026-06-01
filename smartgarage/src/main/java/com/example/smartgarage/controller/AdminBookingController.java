package com.example.smartgarage.controller;

import com.example.smartgarage.dto.booking.*;
import com.example.smartgarage.dto.ConfirmBookingRequest;
import com.example.smartgarage.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin Booking API", description = "Quản lý lịch hẹn phía quản trị")
@RestController
@RequestMapping("/api/v1/admin/bookings")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Operation(summary = "Admin xem toàn bộ lịch hẹn", description = "Có thể lọc theo status như: PENDING, CONFIRMED, COMPLETED, CANCELLED")
    @GetMapping
    public ResponseEntity<Page<BookingResponse>> getAllBookings(@RequestParam(required = false) String status,
                                                                @RequestParam(required = false) Long branchId,
                                                                @RequestParam(required = false) String keyword,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, branchId, keyword, page, size));
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

    @Operation(summary = "Admin xác nhận khách hàng đã tới cửa hàng")
    @PatchMapping("/{bookingId}/arrive")
    public ResponseEntity<BookingResponse> markArrived(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.markBookingArrived(bookingId));
    }

    @Operation(summary = "Admin bắt đầu xử lý xe")
    @PatchMapping("/{bookingId}/start")
    public ResponseEntity<BookingResponse> startBooking(@PathVariable Long bookingId,
                                                        @Valid @RequestBody StartBookingRequest request) {
        return ResponseEntity.ok(bookingService.startBooking(bookingId, request.getVehicleConditionBeforeRepair()));
    }

    @Operation(summary = "Admin đổi thợ phụ trách booking")
    @PatchMapping("/{bookingId}/reassign-mechanic")
    public ResponseEntity<BookingResponse> reassignMechanic(@PathVariable Long bookingId,
                                                            @Valid @RequestBody ReassignMechanicRequest request) {
        return ResponseEntity.ok(bookingService.reassignMechanic(bookingId, request.getMechanicId()));
    }

    @Operation(summary = "Admin hủy lịch hẹn")
    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long bookingId,  @Valid @RequestBody AdminCancelBookingRequest request) {
        return ResponseEntity.ok(bookingService.cancelBookingForAdmin(bookingId, request.getCancelReason()));
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

    @Operation(summary = "Admin thêm dịch vụ vào booking")
    @PostMapping("/{bookingId}/services")
    public ResponseEntity<BookingResponse> addService(@PathVariable Long bookingId,
                                                      @Valid @RequestBody AddBookingServiceRequest request) {
        return ResponseEntity.ok(bookingService.addServiceToBooking(bookingId, request.getServiceId()));
    }

    @Operation(summary = "Admin thay toàn bộ danh sách dịch vụ trong booking")
    @PutMapping("/{bookingId}/services")
    public ResponseEntity<BookingResponse> replaceServices(@PathVariable Long bookingId,
                                                           @Valid @RequestBody ReplaceBookingServicesRequest request) {
        return ResponseEntity.ok(bookingService.replaceBookingServices(bookingId, request.getServiceIds()));
    }

    @Operation(summary = "Admin xóa dịch vụ khỏi booking")
    @DeleteMapping("/{bookingId}/services/{serviceId}")
    public ResponseEntity<BookingResponse> removeService(@PathVariable Long bookingId,
                                                         @PathVariable Long serviceId) {
        return ResponseEntity.ok(bookingService.removeBookingService(bookingId, serviceId));
    }
}
