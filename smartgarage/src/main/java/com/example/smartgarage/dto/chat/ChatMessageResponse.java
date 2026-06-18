package com.example.smartgarage.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
