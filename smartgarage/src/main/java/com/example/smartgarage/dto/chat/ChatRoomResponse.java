package com.example.smartgarage.dto.chat;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatRoomResponse {
    private Long id;
    private Long bookingId;
    private String bookingStatus;
    private Long branchId;
    private String branchName;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String licensePlate;
    private String vehicleName;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private LocalDateTime createdAt;
}
