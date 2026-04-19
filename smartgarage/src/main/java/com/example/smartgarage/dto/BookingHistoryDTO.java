package com.example.smartgarage.dto;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class BookingHistoryDTO {
    private Long id;
    private LocalDateTime bookingTime;
    private LocalDateTime arrivalSlotStart;
    private LocalDateTime arrivalSlotEnd;
    private LocalDateTime arrivalTime;
    private BookingStatus status;
    private String note;
    private String vehicleName; // Ví dụ: Honda Sh 150i
    private String licensePlate;
    // Chỉ lấy tên chi nhánh
    private String branchName;
    // Danh sách tên các dịch vụ và tổng tiền
    private List<String> serviceNames;
    private BigDecimal totalPrice;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;

    // Hàm static để chuyển đổi từ Entity sang DTO
    public static BookingHistoryDTO fromEntity(Booking booking) {
        BookingHistoryDTO dto = new BookingHistoryDTO();
        dto.setId(booking.getId());
        dto.setBookingTime(booking.getBookingTime());
        dto.setArrivalSlotStart(booking.getArrivalSlotStart());
        dto.setArrivalSlotEnd(booking.getArrivalSlotEnd());
        dto.setArrivalTime(booking.getArrivalTime());
        dto.setStatus(booking.getStatus());
        dto.setNote(booking.getNote());
        dto.setPaymentMethod(booking.getPaymentMethod());
        dto.setPaymentStatus(booking.getPaymentStatus());

        if (booking.getVehicle() != null) {
            dto.setVehicleName(booking.getVehicle().getBrand() + " " + booking.getVehicle().getModel());
            dto.setLicensePlate(booking.getVehicle().getLicensePlate());
        }

        if (booking.getBranch() != null) {
            dto.setBranchName(booking.getBranch().getName());
        }

        dto.setServiceNames(booking.getBookedServices().stream()
                .map(s -> s.getService().getName())
                .collect(Collectors.toList()));

        dto.setTotalPrice(BigDecimal.valueOf(booking.getBookedServices().stream()
                .mapToDouble(s -> s.getPriceAtBooking().doubleValue())
                .sum()));
        return dto;
    }
}
