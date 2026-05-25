package com.example.smartgarage.entity;

import com.example.smartgarage.enums.MembershipTier;
import com.example.smartgarage.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInvoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 100)
    private String invoiceNumber;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "service_amount", precision = 15, scale = 2)
    private BigDecimal serviceAmount;

    @Column(name = "part_amount", precision = 15, scale = 2)
    private BigDecimal partAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_tier", length = 20)
    private MembershipTier membershipTier;

    @Column(name = "membership_discount_rate", precision = 5, scale = 2)
    private BigDecimal membershipDiscountRate;

    @Column(name = "membership_discount_amount", precision = 15, scale = 2)
    private BigDecimal membershipDiscountAmount;

    @Column(name = "points_earned")
    private Integer pointsEarned;

    @Column(name = "final_amount", precision = 15, scale = 2)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
