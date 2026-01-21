package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review,Long> {
    // 1. Kiểm tra xem một đơn hàng đã được đánh giá chưa (để tránh đánh giá trùng lặp)
    boolean existsByBookingId(Long bookingId);
    // 2. Tìm đánh giá dựa trên ID đơn hàng
    Optional<Review> findByBookingId(Long bookingId);

    // 3. Lấy tất cả đánh giá của một thợ sửa xe cụ thể
    // Truy vấn thông qua mối quan hệ Review -> Booking -> Mechanic
    List<Review> findAllByBookingMechanicId(Long mechanicId);

    // 4. TÍNH ĐIỂM TRUNG BÌNH CỦA THỢ (Dùng cho Dashboard/Profile thợ)
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.mechanic.id = :mechanicId")
    Double getAverageRatingByMechanicId(@Param("mechanicId") Long mechanicId);

    // 5. Lấy 5 đánh giá mới nhất để hiển thị lên bảng tin Dashboard
    List<Review> findTop5ByOrderByCreatedAtDesc();
    // Phân trang
    Page<Review> findAllByBookingMechanicId(Long mechanicId, Pageable pageable);
}
