package com.example.smartgarage.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mechanics")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Mechanic {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 15)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String status = "ACTIVE"; // Trạng thái: ACTIVE, INACTIVE, BUSY

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Mỗi thợ sửa chữa thuộc về một chi nhánh cụ thể
    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"mechanics", "bookings"})
    private Branch branch;

    // Một thợ có thể được giao nhiều lịch hẹn sửa chữa
    @OneToMany(mappedBy = "mechanic")
    @JsonIgnore
    private List<Booking> bookings;
}
