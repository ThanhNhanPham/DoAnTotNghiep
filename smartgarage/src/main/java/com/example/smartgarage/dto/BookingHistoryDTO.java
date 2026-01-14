package com.example.smartgarage.dto;
import com.example.smartgarage.entity.Booking;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class BookingHistoryDTO {
    private Long id;
    private LocalDateTime bookingTime;
    private String status;
    private String note;
    private String motorbikeName; // Ví dụ: Honda Sh 150i
    private String licensePlate;
    // Chỉ lấy tên chi nhánh
    private String branchName;
    // Danh sách tên các dịch vụ và tổng tiền
    private List<String> serviceNames;
    private Double totalPrice;

    // Hàm static để chuyển đổi từ Entity sang DTO
    public static BookingHistoryDTO fromEntity(Booking booking) {
        BookingHistoryDTO dto = new BookingHistoryDTO();
        dto.setId(booking.getId());
        dto.setBookingTime(booking.getBookingTime());
        dto.setStatus(booking.getStatus());
        dto.setNote(booking.getNote());

        if (booking.getMotorbike() != null) {
            dto.setMotorbikeName(booking.getMotorbike().getBrand() + " " + booking.getMotorbike().getModel());
            dto.setLicensePlate(booking.getMotorbike().getLicensePlate());
        }

        if (booking.getBranch() != null) {
            dto.setBranchName(booking.getBranch().getName());
        }

        dto.setServiceNames(booking.getServices().stream()
                .map(s -> s.getName())
                .collect(Collectors.toList()));

        dto.setTotalPrice(booking.getServices().stream()
                .mapToDouble(s -> s.getPrice().doubleValue())
                .sum());
        return dto;
    }
}
