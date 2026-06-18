package com.example.smartgarage.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRoomRequest {
    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;
}
