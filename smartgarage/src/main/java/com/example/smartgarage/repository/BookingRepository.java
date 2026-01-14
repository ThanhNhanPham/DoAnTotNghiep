package com.example.smartgarage.repository;
import com.example.smartgarage.dto.ServiceStatisticDTO;
import com.example.smartgarage.entity.Booking;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking> findAllByUserIdOrderByBookingTimeDesc(Long userId);
    // Tìm lịch hẹn của một chi nhánh (dành cho Admin chi nhánh quản lý)
    List<Booking> findAllByBranchId(Long branchId);
    List<Booking> findByStatus(String status);
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(String status);

    @Query("SELECT SUM(s.price) FROM Booking b JOIN b.services s WHERE b.status = 'COMPLETED'")
    BigDecimal calculateTotalRevenue();

    // Lấy top dịch vụ được sử dụng nhiều nhất (Sử dụng constructor expression trong JPQL)
    @Query("SELECT new com.example.smartgarage.dto.ServiceStatisticDTO(s.name, COUNT(s)) " +
            "FROM Booking b JOIN b.services s " +
            "GROUP BY s.name ORDER BY COUNT(s) DESC")
    List<ServiceStatisticDTO> findTopServices(Pageable pageable);
}
