package com.example.smartgarage.dto.chat.websocket;

import com.example.smartgarage.dto.chat.ChatMessageResponse;
import com.example.smartgarage.dto.chat.ChatRoomResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatSocketMessageEvent {
    private String type;
    private Long roomId;
    private ChatMessageResponse message;
    private ChatRoomResponse room;
    private String actorRole;
    private String actorName;
    private LocalDateTime readAt;

    public static ChatSocketMessageEvent created(ChatMessageResponse message) {
        return ChatSocketMessageEvent.builder()
                .type("MESSAGE_CREATED")
                .roomId(message.getRoomId())
                .message(message)
                .build();
    }

    public static ChatSocketMessageEvent typing(Long roomId, String actorName, String actorRole) {
        return ChatSocketMessageEvent.builder()
                .type("TYPING")
                .roomId(roomId)
                .actorName(actorName)
                .actorRole(actorRole)
                .build();
    }

    public static ChatSocketMessageEvent roomRead(Long roomId, String actorName, String actorRole, LocalDateTime readAt) {
        return ChatSocketMessageEvent.builder()
                .type("ROOM_READ")
                .roomId(roomId)
                .actorName(actorName)
                .actorRole(actorRole)
                .readAt(readAt)
                .build();
    }

    public static ChatSocketMessageEvent roomUpsert(ChatRoomResponse room) {
        return ChatSocketMessageEvent.builder()
                .type("ROOM_UPSERT")
                .roomId(room != null ? room.getId() : null)
                .room(room)
                .build();
    }
}
