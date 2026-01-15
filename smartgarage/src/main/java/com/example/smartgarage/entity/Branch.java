package com.example.smartgarage.entity;

import jakarta.persistence.*;
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
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại thợ không hợp lệ")
    private String phone;

    @Column(name = "image_url")
    @Size(max = 255, message = "Đường dẫn ảnh quá dài")
    private String imageUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;


}
