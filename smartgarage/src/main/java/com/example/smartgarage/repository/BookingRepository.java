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

    @Query("""
            SELECT b FROM Booking b
            WHERE b.branch.id = :branchId
              AND b.status IN :statuses
              AND b.arrivalSlotStart < :rangeEnd
              AND b.arrivalSlotEnd > :rangeStart
            """)
    List<Booking> findOverlappingBookings(@Param("branchId") Long branchId,
                                          @Param("statuses") List<BookingStatus> statuses,
                                          @Param("rangeStart") LocalDateTime rangeStart,
                                          @Param("rangeEnd") LocalDateTime rangeEnd);

    // 1. Chuyển String sang BookingStatus để đồng nhất kiểu dữ liệu
    List<Booking> findByStatus(BookingStatus status);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            LEFT JOIN b.user u
            LEFT JOIN b.vehicle v
            LEFT JOIN b.branch br
            LEFT JOIN b.mechanic m
            LEFT JOIN b.bookedServices bs
            LEFT JOIN bs.service s
            LEFT JOIN b.bookedParts bp
            LEFT JOIN bp.part p
            WHERE (:status IS NULL OR b.status = :status)
              AND (:branchId IS NULL OR br.id = :branchId)
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(v.licensePlate, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(br.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(m.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(p.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Page<Booking> searchAdminBookings(@Param("status") BookingStatus status,
                                      @Param("branchId") Long branchId,
                                      @Param("keyword") String keyword,
                                      Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);

    long countByMechanicIdAndStatusInAndIdNot(Long mechanicId, List<BookingStatus> statuses, Long id);

    // 2. Sửa lỗi: Truyền tham số Enum vào thay vì viết cứng chuỗi 'COMPLETED'
    @Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status = :status")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT new com.example.smartgarage.dto.ServiceStatisticDTO(s.name, COUNT(bs)) " +
            "FROM Booking b " +
            "JOIN b.bookedServices bs " +
            "JOIN bs.service s " +
            "GROUP BY s.name ORDER BY COUNT(bs) DESC")
    List<ServiceStatisticDTO> findTopServices(Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingTime >= :startOfDay")
    long countNewBookingsToday(@Param("startOfDay") LocalDateTime startOfDay);

    // 3. Tối ưu hóa: Thêm tham số status để linh hoạt tính doanh thu theo kỳ
    @Query("SELECT SUM(b.totalAmount) FROM Booking b " +
            "WHERE b.status = :status AND b.bookingTime BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueByPeriod(@Param("status") BookingStatus status,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> countAllStatusRaw();

    Page<Booking> findAllByBranchId(Long branchId, Pageable pageable);
    // tìm tất cả booking hoàn thành cách đây 6 tháng
    @Query("SELECT b FROM Booking b WHERE b.status = 'COMPLETED' AND b.updatedAt >= :startDate AND b.updatedAt < :endDate")
    List<Booking> findBookingsForReminder(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
