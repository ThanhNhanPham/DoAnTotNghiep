package com.example.smartgarage.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="consultation_histories")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ConsultationHistory {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Mô tả tình trạng xe không được để trống")
    @Size(min = 10, message = "Mô tả phải có ít nhất 10 ký tự để AI có thể chẩn đoán chính xác")
    @Column(name = "customer_issue", nullable = false, columnDefinition = "TEXT")
    private String customerIssue;

    @Column(name = "ai_suggestion", nullable = false, columnDefinition = "TEXT")
    private String aiSuggestion;

    // THÊM: Lưu danh sách ID dịch vụ gợi ý (Ví dụ: "1,2,5") để frontend dễ xử lý
    @Column(name = "suggested_service_ids")
    private String suggestedServiceIds;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @NotNull(message = "Lịch sử tư vấn phải gắn với một khách hàng")
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;
    // THÊM: Tư vấn này có dẫn đến đặt lịch không?
    @OneToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

}
