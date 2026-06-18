package com.example.smartgarage.dto.chat.websocket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatSocketSendMessageRequest {
    @NotNull(message = "Room ID không được để trống")
    private Long roomId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 2000, message = "Nội dung tin nhắn không được vượt quá 2000 ký tự")
    private String content;
}
