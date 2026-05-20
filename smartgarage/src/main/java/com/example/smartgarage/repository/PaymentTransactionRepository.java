package com.example.smartgarage.repository;

import com.example.smartgarage.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByOrderId(String orderId);
    Optional<PaymentTransaction> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
