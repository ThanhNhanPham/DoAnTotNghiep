package com.example.smartgarage.service;

import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class DashboardService {
    private final BookingRepository bookingRepository;
    public DashboardService(@Autowired BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }
    public DashboardStatusDTO getDashboardStatus() {
        DashboardStatusDTO dto = new DashboardStatusDTO();

        // 1. Lấy các số liệu đếm cơ bản
        dto.setTotalBookings(bookingRepository.count());
        dto.setPendingBookings(bookingRepository.countByStatus(BookingStatus.PENDING));
        dto.setConfirmedBookings(bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        dto.setCompletedBookings(bookingRepository.countByStatus(BookingStatus.COMPLETED));
        dto.setCancelledBookings(bookingRepository.countByStatus(BookingStatus.CANCELLED));

        // 2. Tính tổng doanh thu (Xử lý null để tránh lỗi)
        BigDecimal revenue = bookingRepository.calculateTotalRevenue();
        dto.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        // 3. Lấy Top 5 dịch vụ hot nhất
        // PageRequest.of(0, 5) giúp giới hạn lấy đúng 5 kết quả
        dto.setTopServices(bookingRepository.findTopServices(PageRequest.of(0, 5)));

        return dto;
    }
}
