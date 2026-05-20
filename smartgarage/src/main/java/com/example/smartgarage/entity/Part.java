package com.example.smartgarage.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name="parts")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Part {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Tên linh kiện không được để trống")
    @Size(min = 2, max = 100, message = "Tên linh kiện phải từ 2 đến 100 ký tự")
    private String name;        // Tên linh kiện (VD: Lốp Michelin)
    private String description;// Mô tả chi tiết về linh kiện
    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá linh kiện phải lớn hơn 0")
    private BigDecimal price;     // Giá bán ra
    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được nhỏ hơn 0")
    private Integer quantity;    // Số lượng tồn kho
    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;         // Đơn vị tính (Cái, Lít, Bộ...)

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Branch branch;

    @OneToMany(mappedBy = "part", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<BookedPart> bookedParts;

}
