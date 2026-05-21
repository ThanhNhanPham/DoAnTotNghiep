package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review,Long> {
    boolean existsByBookingId(Long bookingId);

    Optional<Review> findByBookingId(Long bookingId);

    List<Review> findTop5ByOrderByCreatedAtDesc();

    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r")
    Double getAverageRating();

    @Query("SELECT COUNT(r) FROM Review r")
    long countAllReviews();
}
