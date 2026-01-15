package com.example.smartgarage.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"motorbikes", "bookings", "password"})
    private User user; // Khách hàng đặt lịch

    @ManyToOne
    @JoinColumn(name = "motorbike_id", nullable = false)
    private Motorbike motorbike; // Xe mang đi sửa

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch; // Chi nhánh thực hiện

    @ManyToOne
    @JoinColumn(name = "mechanic_id")
    private Mechanic mechanic; // Thợ sửa (có thể để trống lúc đầu)

    @Column(name = "booking_time", nullable = false)
    private LocalDateTime bookingTime;

    private String status = "PENDING"; // Trạng thái: PENDING, CONFIRMED, COMPLETED, CANCELLED

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Mối quan hệ Nhiều-Nhiều với bảng Services thông qua bảng trung gian booking_services
    @ManyToMany
    @JoinTable(
            name = "booking_services",
            joinColumns = @JoinColumn(name = "booking_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private List<Service> services;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "booking_parts",
            joinColumns = @JoinColumn(name = "booking_id"),
            inverseJoinColumns = @JoinColumn(name = "part_id")
    )
    private List<Part> parts = new ArrayList<>();
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
}