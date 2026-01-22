package com.example.smartgarage.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data// tự động tạo getter setter
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private  Long id;
    private String title;
    private String content;
    private boolean isRead=false;
    private LocalDateTime createdAt = LocalDateTime.now();
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Thông báo này gửi cho ai?
}
