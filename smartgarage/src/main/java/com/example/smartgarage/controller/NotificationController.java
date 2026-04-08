package com.example.smartgarage.controller;

import com.example.smartgarage.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Notification API", description = "Quản lý thông báo")
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    @Operation(summary="Lấy danh sách thông báo")
    @GetMapping
    public ResponseEntity<?> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok("Danh sách thông báo của" + auth.getName());
    }
    @Operation(summary="Api đánh dấu là đã đọc")
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok("Đánh dấu là đã đọc");
    }
}
