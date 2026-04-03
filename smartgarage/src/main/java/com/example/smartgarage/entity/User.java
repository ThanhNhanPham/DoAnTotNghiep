package com.example.smartgarage.entity;

import com.example.smartgarage.enums.Role;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Entity
@Table(name ="users")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    @NotBlank(message = "Họ tên không được để trống")
    @Column(name = "full_name")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$",
            message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tên tỉnh không được quá 100 ký tự")
    private String province;
    @NotBlank(message = "Phường/Xã không được để trống")
    @Size(max = 100, message = "Tên phường/xã không được quá 100 ký tự")
    private String ward;
    @NotBlank(message = "Số nhà không được để trống")
    @Size(max = 100, message = "Số nhà không được quá 100 ký tự")
    @Column(name = "house_number")
    private String houseNumber; // Số nhà, tên đường
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Role role; // 'ADMIN', 'CUSTOMER','SUPER_ADMIN'

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch; // Nếu là nhân viên thì thuộc chi nhánh nào

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"user", "motorbikes", "bookings"})
    private List<Motorbike> motorbikes;

    // Các booking của user
    public String getFullAddress() {
        if (this.province == null) return "";
        return String.format("%s, %s, %s",
                this.houseNumber,
                this.ward,
                this.province);
    }
}
