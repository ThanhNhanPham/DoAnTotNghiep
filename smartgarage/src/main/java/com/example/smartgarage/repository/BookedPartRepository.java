package com.example.smartgarage.repository;

import com.example.smartgarage.entity.BookedPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookedPartRepository extends JpaRepository<BookedPart,Long> {
    List<BookedPart> findByBookingId(Long bookingId);
    void deleteByBookingId(Long bookingId);
}
