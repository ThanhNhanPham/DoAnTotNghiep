package com.example.smartgarage.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "booking_services")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class BookedService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    @JsonIgnore
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "service_id")
    @JsonIgnoreProperties
    private Service service; // Lưu ý tên class Service của bạn

    @Column(precision = 19, scale = 2)
    private BigDecimal priceAtBooking; // Giá dịch vụ tại thời điểm đóAt
}
