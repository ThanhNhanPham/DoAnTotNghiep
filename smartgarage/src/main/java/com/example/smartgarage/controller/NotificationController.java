package com.example.smartgarage.controller;

import com.example.smartgarage.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    @Autowired private NotificationService notificationService;
    @GetMapping
    public ResponseEntity<?> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok("Danh sách thông báo của" + auth.getName());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("id")  Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok("Đánh dấu là đã đọc");
    }
}
