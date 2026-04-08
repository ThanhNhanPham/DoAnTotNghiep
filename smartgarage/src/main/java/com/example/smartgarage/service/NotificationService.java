package com.example.smartgarage.service;

import com.example.smartgarage.entity.Notification;
import com.example.smartgarage.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    public NotificationService(@Autowired NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    // dưới đây là lấy danh sách thông báo cho người dùng, sắp xếp theo thời gian tạo mới nhất
    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // dưới đây là đếm số thông báo chưa đọc
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationId));
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
