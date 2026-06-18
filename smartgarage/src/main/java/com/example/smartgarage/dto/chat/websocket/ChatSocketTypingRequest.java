package com.example.smartgarage.dto.chat.websocket;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatSocketTypingRequest {
    @NotNull(message = "Room ID không được để trống")
    private Long roomId;
}
