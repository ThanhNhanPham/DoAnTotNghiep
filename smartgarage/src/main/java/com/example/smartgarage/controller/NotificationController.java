package com.example.smartgarage.controller;

import com.example.smartgarage.dto.NotificationResponse;
import com.example.smartgarage.dto.UnreadNotificationCountResponse;
import com.example.smartgarage.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(auth.getName()));
    }
    @Operation(summary="Lấy thông báo chi tiết theo id")
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotificationById(id, authentication.getName()));
    }

    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountResponse> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(new UnreadNotificationCountResponse(
                notificationService.countUnreadNotifications(auth.getName())
        ));
    }

    @Operation(summary="Api đánh dấu là đã đọc")
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id, Authentication auth) {
        notificationService.markAsRead(id, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Đánh dấu là đã đọc"));
    }

    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }

    @Operation(summary = "Xóa một thông báo")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long id, Authentication auth){
        String username = auth.getName();
        notificationService.deleteNotification(id, username);
        return ResponseEntity.ok(Map.of("message", "Đã xóa thông báo"));
    }
}
