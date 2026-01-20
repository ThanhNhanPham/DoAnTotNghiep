package com.example.smartgarage.repository;

import com.example.smartgarage.dto.ServiceStatisticDTO;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.enums.BookingStatus; // Cần import Enum này
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking> findAllByUserIdOrderByBookingTimeDesc(Long userId);

    List<Booking> findAllByBranchId(Long branchId);

    // 1. Chuyển String sang BookingStatus để đồng nhất kiểu dữ liệu
    List<Booking> findByStatus(BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);

    // 2. Sửa lỗi: Truyền tham số Enum vào thay vì viết cứng chuỗi 'COMPLETED'
    @Query("SELECT SUM(s.price) FROM Booking b JOIN b.services s WHERE b.status = :status")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT new com.example.smartgarage.dto.ServiceStatisticDTO(s.name, COUNT(s)) " +
            "FROM Booking b JOIN b.services s " +
            "GROUP BY s.name ORDER BY COUNT(s) DESC")
    List<ServiceStatisticDTO> findTopServices(Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingTime >= :startOfDay")
    long countNewBookingsToday(@Param("startOfDay") LocalDateTime startOfDay);

    // 3. Tối ưu hóa: Thêm tham số status để linh hoạt tính doanh thu theo kỳ
    @Query("SELECT SUM(s.price) FROM Booking b JOIN b.services s " +
            "WHERE b.status = :status AND b.bookingTime BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueByPeriod(@Param("status") BookingStatus status,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countAllStatusRaw();

    Page<Booking> findAllByBranchId(Long branchId, Pageable pageable);
}