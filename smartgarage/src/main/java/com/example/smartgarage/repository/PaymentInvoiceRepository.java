package com.example.smartgarage.repository;

import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentInvoiceRepository extends JpaRepository<PaymentInvoice, Long> {
    Optional<PaymentInvoice> findByBookingId(Long bookingId);
    Optional<PaymentInvoice> findByInvoiceNumber(String invoiceNumber);
    Page<PaymentInvoice> findByBookingUserEmail(String email, Pageable pageable);
    Page<PaymentInvoice> findByBookingUserEmailAndBookingPaymentStatus(String email, PaymentStatus status, Pageable pageable);
    Page<PaymentInvoice> findByBookingPaymentStatus(PaymentStatus status, Pageable pageable);

    @Query("""
            SELECT DISTINCT pi FROM PaymentInvoice pi
            LEFT JOIN FETCH pi.booking b
            LEFT JOIN FETCH b.user u
            LEFT JOIN FETCH b.vehicle v
            WHERE LOWER(COALESCE(pi.invoiceNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR COALESCE(u.phone, '') LIKE CONCAT('%', :keyword, '%')
               OR LOWER(COALESCE(v.licensePlate, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY pi.issuedAt DESC
            """)
    List<PaymentInvoice> searchAdminInvoices(@Param("keyword") String keyword, Pageable pageable);
}
