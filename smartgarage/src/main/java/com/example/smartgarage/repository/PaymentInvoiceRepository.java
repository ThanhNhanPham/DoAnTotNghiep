package com.example.smartgarage.repository;

import com.example.smartgarage.entity.PaymentInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentInvoiceRepository extends JpaRepository<PaymentInvoice, Long> {
    Optional<PaymentInvoice> findByBookingId(Long bookingId);
    Optional<PaymentInvoice> findByInvoiceNumber(String invoiceNumber);
}
