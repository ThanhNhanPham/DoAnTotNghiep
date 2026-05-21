package com.example.smartgarage.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "branches")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
@Getter
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Tên chi nhánh không được để trống")
    private String name;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @NotBlank(message = "Số điện thoại chi nhánh không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại chi nhánh không hợp lệ")
    private String phone;

    @Column(name = "image_url")
    @Size(max = 255, message = "Đường dẫn ảnh quá dài")
    private String imageUrl;

    @DecimalMin(value = "-90.0", inclusive = true, message = "Vĩ độ phải nằm trong khoảng -90 đến 90")
    @DecimalMax(value = "90.0", inclusive = true, message = "Vĩ độ phải nằm trong khoảng -90 đến 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", inclusive = true, message = "Kinh độ phải nằm trong khoảng -180 đến 180")
    @DecimalMax(value = "180.0", inclusive = true, message = "Kinh độ phải nằm trong khoảng -180 đến 180")
    private Double longitude;

    @Column(name = "is_active")
    private Boolean isActive = true;


}
