package com.example.smartgarage.entity;

import com.example.smartgarage.enums.MechanicStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mechanics")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mechanic {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min=2,max = 100, message = "Họ và tên từ 2 đến 100 ký tự")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại thợ không hợp lệ")
    @Column(length = 15)
    private String phone;
    @Size(max = 500, message = "Địa chỉ không quá 500 ký tự")
    @Column(columnDefinition = "TEXT")
    private String address;
    @NotNull(message = "Trạng thái không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MechanicStatus status; // Trạng thái: ACTIVE, INACTIVE, BUSY

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt ;
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // Mỗi thợ sửa chữa thuộc về một chi nhánh cụ thể
    @NotNull(message = "Thợ phải thuộc về một chi nhánh")
    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"mechanics", "bookings"})
    private Branch branch;

    // Một thợ có thể được giao nhiều lịch hẹn sửa chữa
    @OneToMany(mappedBy = "mechanic")
    @JsonIgnore
    private List<Booking> bookings;
}
