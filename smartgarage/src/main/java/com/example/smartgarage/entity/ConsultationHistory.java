package com.example.smartgarage.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name="consultation_histories")
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationHistory {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_issue", nullable = false, columnDefinition = "TEXT")
    private String customerIssue;

    @Column(name = "ai_suggestion", nullable = false, columnDefinition = "TEXT")
    private String aiSuggestion;

    // THÊM: Lưu danh sách ID dịch vụ gợi ý (Ví dụ: "1,2,5") để frontend dễ xử lý
    @Column(name = "suggested_service_ids")
    private String suggestedServiceIds;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;
    // THÊM: Tư vấn này có dẫn đến đặt lịch không?
    @OneToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;
    public Booking getBooking() {
        return booking;
    }
    public void setBooking(Booking booking) {
        this.booking = booking;
    }
    public User getCustomer() {
        return customer;
    }
    public void setCustomer(User customer) {
        this.customer = customer;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomerIssue() {
        return customerIssue;
    }

    public void setCustomerIssue(String customerIssue) {
        this.customerIssue = customerIssue;
    }

    public String getAiSuggestion() {
        return aiSuggestion;
    }

    public void setAiSuggestion(String aiSuggestion) {
        this.aiSuggestion = aiSuggestion;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
