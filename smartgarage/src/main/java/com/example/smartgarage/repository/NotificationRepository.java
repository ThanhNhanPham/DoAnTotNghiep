package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification,Long> {
    // lấy thông báo của user theo thứ tự mới nhất trước
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // đếm số thông báo chưa đọc của user
    long countByUserIdAndIsReadFalse(Long userId);
}
