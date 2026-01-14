package com.example.smartgarage.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingRequest {
    private Long userId;        // ID người đặt
    private Long motorbikeId;   // ID xe máy được chọn
    private Long branchId;      // ID chi nhánh Gara
    private LocalDateTime bookingTime; // Thời gian hẹn khách đến
    private List<Long> serviceIds; // Danh sách ID dịch vụ (AI gợi ý + khách chọn thêm)
    private String note; // ghi chú của khách hàng
}
