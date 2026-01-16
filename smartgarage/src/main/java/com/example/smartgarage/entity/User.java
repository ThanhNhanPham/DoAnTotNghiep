package com.example.smartgarage.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
    @JsonIgnore
    private String password;
    @NotBlank(message = "Họ tên không được để trống")
    @Column(name = "full_name")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$",
            message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @Column(nullable = false)
    private String role; // 'ADMIN', 'CUSTOMER'

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch; // Nếu là nhân viên thì thuộc chi nhánh nào

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"user", "motorbikes", "bookings"})
    private List<Motorbike> motorbikes;

}
