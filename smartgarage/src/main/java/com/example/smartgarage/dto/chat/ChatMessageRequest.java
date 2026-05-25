package com.example.smartgarage.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatMessageRequest {
    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 2000, message = "Nội dung tin nhắn không được vượt quá 2000 ký tự")
    private String content;
}
