package com.example.smartgarage.repository;

import com.example.smartgarage.entity.BookedService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookedServiceRepository extends JpaRepository<BookedService,Long> {
    List<BookedService> findByBookingId(Long bookingId);
    void deleteByBookingId(Long bookingId);
}
