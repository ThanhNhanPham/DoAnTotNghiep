package com.example.smartgarage.service;

import com.example.smartgarage.dto.ReviewRequest;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.Review;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.ReviewRepository;
import com.example.smartgarage.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ReviewService {
    @Autowired  private ReviewRepository reviewRepository;
    @Autowired  private UserRepository userRepository;
    @Autowired  private BookingRepository bookingRepository;
    @Transactional
    public Review createReview(String email, ReviewRequest request) {
        // 1. Tìm đơn hàng
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + request.getBookingId()));

        // 2. KIỂM TRA QUYỀN SỞ HỮU (Quan trọng cho bảo mật)
        if (!booking.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Bạn không có quyền đánh giá đơn hàng của người khác!");
        }

        // 3. KIỂM TRA LOGIC: Chỉ đơn hàng COMPLETED mới được đánh giá
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sau khi xe đã sửa xong!");
        }

        // 4. Kiểm tra xem đã đánh giá chưa
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new RuntimeException("Đơn hàng này đã được đánh giá trước đó.");
        }

        // 5. Tìm user an toàn hơn
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));

        Review review = new Review();
        review.setBooking(booking);
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        return reviewRepository.save(review);
    }
    public Double getAverageRating(Long mechanicId) {
        Double average = reviewRepository.getAverageRatingByMechanicId(mechanicId);
        if (average == null) return 0.0;

        // Làm tròn đến 1 chữ số thập phân để hiển thị đẹp hơn
        return Math.round(average * 10.0) / 10.0;
    }
    @Transactional
    public Review updateAdminReply(Long reviewId, String replyContent) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá để phản hồi"));

        review.setAdminReply(replyContent);
        review.setRepliedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }
}
