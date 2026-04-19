package com.example.smartgarage.entity;

import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonIgnoreProperties({"vehicles", "bookings", "password"})
    private User user; // Khách hàng đặt lịch
    @NotNull(message = "Vui lòng chọn xe của khách hàng")
    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle; // Xe mang đi sửa

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

    @Column(name = "arrival_slot_start")
    private LocalDateTime arrivalSlotStart;

    @Column(name = "arrival_slot_end")
    private LocalDateTime arrivalSlotEnd;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING; // Trạng thái: PENDING, CONFIRMED, COMPLETED, CANCELLED

    @Size(max = 1000, message = "Ghi chú không được quá 1000 ký tự")
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @org.hibernate.annotations.UpdateTimestamp // TỰ ĐỘNG CẬP NHẬT KHI ĐƠN HÀNG XONG
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    // Mối quan hệ Một-Nhiều với bảng Services thông qua bảng trung gian booking_services
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedService> bookedServices = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedPart> bookedParts = new ArrayList<>();

    @DecimalMin(value = "0.0", message = "Tổng tiền không được nhỏ hơn 0")
    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, columnDefinition = "varchar(255) default 'CASH'")
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, columnDefinition = "varchar(255) default 'UNPAID'")
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @PrePersist
    public void applyPaymentDefaults() {
        if (status == null) {
            status = BookingStatus.PENDING;
        }
        if (paymentMethod == null) {
            paymentMethod = PaymentMethod.CASH;
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.UNPAID;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @Transient
    @JsonProperty("vehicleOwnerName")
    public String getVehicleOwnerName() {
        return user != null ? user.getFullName() : null;
    }
}
