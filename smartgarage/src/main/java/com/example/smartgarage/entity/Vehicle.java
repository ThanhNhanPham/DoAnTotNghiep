package com.example.smartgarage.entity;

import com.example.smartgarage.enums.VehicleType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Setter
@Getter
@Table(name = "vehicles")
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Biển số xe không được để trống")
    @Size(min = 7, max = 20, message = "Biển số xe có độ dài không hợp lệ")
    @Pattern(regexp = "^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{4,5}$",
            message = "Biển số xe không đúng định dạng (VD: 29A-123.45 hoặc 29A1-123.45)")
    @Column(name = "license_plate", unique = true, nullable = false)
    private String licensePlate;

    @NotNull(message = "Hãng xe không được để trống")
    @Size(min = 2, max = 50, message = "Hãng xe phải từ 2 đến 50 ký tự")
    private String brand;

    @NotNull(message = "Mẫu xe không được để trống")
    @Size(max = 50, message = "Tên dòng xe không quá 50 ký tự")
    private String model;

    @Size(max = 30, message = "Mô tả màu sắc quá dài")
    private String color;

    @Column(name = "image_url")
    @Size(max = 255, message = "Đường dẫn ảnh quá dài")
    private String imageUrl;

    @NotNull(message = "Loại xe không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType type;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Transient
    @JsonProperty("ownerName")
    public String getOwnerName() {
        return user != null ? user.getFullName() : null;
    }
}
