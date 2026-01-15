package com.example.smartgarage.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
@NoArgsConstructor
@AllArgsConstructor
public class Service {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String name;
    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String description;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá dịch vụ phải lớn hơn 0")
    @Column(nullable = false)
    private BigDecimal price;

    @Min(value = 1, message = "Thời gian thực hiện phải tối thiểu 1 phút")
    @Max(value = 10080, message = "Thời gian không hợp lệ (tối đa 7 ngày)")
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // Thời gian dự kiến (phút)

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;
    // Ngăn không cho Part gọi ngược lại Booking khi trả về JSON của Service
    @ManyToMany
    @JoinTable(
            name = "service_suggested_parts",
            joinColumns = @JoinColumn(name = "service_id"),
            inverseJoinColumns = @JoinColumn(name = "part_id")
    )
    // Ngăn không cho Part gọi ngược lại Booking khi trả về JSON của Service
    @JsonIgnoreProperties("bookings")
    private List<Part> suggestedParts = new ArrayList<>();
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getActive() {
        return isActive;
    }

    public List<Part> getSuggestedParts() {
        return suggestedParts;
    }

    public void setSuggestedParts(List<Part> suggestedParts) {
        this.suggestedParts = suggestedParts;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }
}
