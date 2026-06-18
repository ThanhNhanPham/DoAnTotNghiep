package com.example.smartgarage.dto.chat.websocket;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatSocketReadRequest {
    @NotNull(message = "Room ID không được để trống")
    private Long roomId;
}
