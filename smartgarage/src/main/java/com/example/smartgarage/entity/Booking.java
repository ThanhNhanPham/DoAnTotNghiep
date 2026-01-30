package com.example.smartgarage.entity;

import com.example.smartgarage.enums.BookingStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

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
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @NotNull(message = "Khách hàng không được để trống")
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"motorbikes", "bookings", "password"})
    private User user; // Khách hàng đặt lịchs
    @NotNull(message = "Vui lòng chọn xe của khách hàng")
    @ManyToOne
    @JoinColumn(name = "motorbike_id", nullable = false)
    private Motorbike motorbike; // Xe mang đi sửa

    @NotNull(message = "Vui lòng chọn chi nhánh")
    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch; // Chi nhánh thực hiện

    @ManyToOne
    @JoinColumn(name = "mechanic_id")
    private Mechanic mechanic; // Thợ sửa (có thể để trống lúc đầu)

    @NotNull(message = "Thời gian đặt lịch không được để trống")
    @FutureOrPresent(message = "Thời gian đặt lịch phải ở hiện tại hoặc tương lai")
    @Column(name = "booking_time", nullable = false)
    private LocalDateTime bookingTime;

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    @Enumerated(EnumType.STRING)
    private BookingStatus status; // Trạng thái: PENDING, CONFIRMED, COMPLETED, CANCELLED

    @Size(max = 1000, message = "Ghi chú không được quá 1000 ký tự")
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @org.hibernate.annotations.UpdateTimestamp // TỰ ĐỘNG CẬP NHẬT KHI ĐƠN HÀNG XONG
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    // Mối quan hệ Một-Nhiều với bảng Services thông qua bảng trung gian booking_services
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedService> bookedServices = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedPart> bookedPart = new ArrayList<>();

    @DecimalMin(value = "0.0", message = "Tổng tiền không được nhỏ hơn 0")
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
}