package com.example.smartgarage.repository;

import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentInvoiceRepository extends JpaRepository<PaymentInvoice, Long> {
    Optional<PaymentInvoice> findByBookingId(Long bookingId);
    Optional<PaymentInvoice> findByInvoiceNumber(String invoiceNumber);
    Page<PaymentInvoice> findByBookingUserEmail(String email, Pageable pageable);
    Page<PaymentInvoice> findByBookingUserEmailAndBookingPaymentStatus(String email, PaymentStatus status, Pageable pageable);
    Page<PaymentInvoice> findByBookingPaymentStatus(PaymentStatus status, Pageable pageable);
}
