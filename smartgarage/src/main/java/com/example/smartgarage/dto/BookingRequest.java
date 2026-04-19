package com.example.smartgarage.dto;

import com.example.smartgarage.enums.PaymentMethod;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingRequest {
    private Long userId;        // ID người đặt
    private Long vehicleId;   // ID xe được chọn
    private Long branchId;      // ID chi nhánh Gara
    private LocalDateTime bookingTime; // Field tương thích cũ, map sang arrivalSlotStart nếu client chưa cập nhật
    private LocalDateTime arrivalSlotStart; // Bắt đầu khung giờ khách dự kiến đến cửa hàng
    private LocalDateTime arrivalSlotEnd; // Kết thúc khung giờ khách dự kiến đến cửa hàng
    private List<Long> serviceIds; // Danh sách ID dịch vụ (AI gợi ý + khách chọn thêm)
    private String note; // ghi chú của khách hàng
    private PaymentMethod paymentMethod; // CASH | MOMO
}
