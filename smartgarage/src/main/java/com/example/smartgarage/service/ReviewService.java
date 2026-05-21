package com.example.smartgarage.service;

import com.example.smartgarage.dto.ReviewSummaryResponse;
import com.example.smartgarage.dto.ReviewRequest;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.Notification;
import com.example.smartgarage.entity.Review;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.exception.ConflictException;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.NotificationRepository;
import com.example.smartgarage.repository.ReviewRepository;
import com.example.smartgarage.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
public class ReviewService {
    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    @Autowired  private ReviewRepository reviewRepository;
    @Autowired  private UserRepository userRepository;
    @Autowired  private BookingRepository bookingRepository;
    @Autowired  private NotificationRepository notificationRepository;
    @Autowired private EmailService emailService;
    @Autowired private EmailTemplateService templateService;
    @Transactional
    public Review createReview(String email, ReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng có ID: " + request.getBookingId()));

        if (!booking.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("Bạn không có quyền đánh giá đơn hàng của người khác");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ConflictException("Bạn chỉ có thể đánh giá sau khi đơn hàng hoàn thành");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException("Đơn hàng này đã được đánh giá trước đó");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        Review review = new Review();
        review.setBooking(booking);
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(StringUtils.hasText(request.getComment()) ? request.getComment().trim() : null);

        Review savedReview = reviewRepository.save(review);
        notifyBranchAdminsForNewReview(savedReview);
        return savedReview;
    }

    public Review getReviewByBooking(Long bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng này chưa có đánh giá"));
    }

    public Page<Review> getReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public ReviewSummaryResponse getReviewSummary() {
        Double average = reviewRepository.getAverageRating();
        double roundedAverage = average == null ? 0.0 : Math.round(average * 10.0) / 10.0;
        return new ReviewSummaryResponse(reviewRepository.countAllReviews(), roundedAverage);
    }

    private void notifyBranchAdminsForNewReview(Review review) {
        Booking booking = review.getBooking();
        if (booking.getBranch() == null || booking.getBranch().getId() == null) {
            return;
        }

        String customerName = review.getUser() != null ? review.getUser().getFullName() : "Khách hàng";
        String title = "Đơn hàng có đánh giá mới";
        String content = String.format(
                "%s vừa đánh giá đơn hàng #%d với %d sao",
                customerName,
                booking.getId(),
                review.getRating()
        );

        for (User admin : userRepository.findByRoleAndBranchId(Role.ADMIN, booking.getBranch().getId())) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setBookingId(booking.getId());
            notification.setTitle(title);
            notification.setContent(content);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public Review updateAdminReply(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá để phản hồi"));

        review.setAdminReply(reply.trim());
        review.setRepliedAt(LocalDateTime.now());

        Notification notify = new Notification();
        notify.setUser(review.getUser());
        notify.setTitle("Gara đã phản hồi đánh giá của bạn");
        notify.setContent("Phản hồi: " + reply.trim());
        notificationRepository.save(notify);

        Review savedReview = reviewRepository.save(review);
        String htmlContent = templateService.buildAdminReplyEmail(
                review.getUser().getFullName(),
                review.getComment(),
                reply.trim()
        );

        try {
            emailService.sendHtmlEmail(review.getUser().getEmail(), "Phản hồi từ Smart Gara", htmlContent);
        } catch (RuntimeException ex) {
            logger.warn("Không gửi được email phản hồi đánh giá {}: {}", reviewId, ex.getMessage());
        }
        return savedReview;
    }
}
