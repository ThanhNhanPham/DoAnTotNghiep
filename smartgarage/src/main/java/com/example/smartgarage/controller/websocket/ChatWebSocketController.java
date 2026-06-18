package com.example.smartgarage.controller.websocket;

import com.example.smartgarage.dto.chat.ChatMessageResponse;
import com.example.smartgarage.dto.chat.websocket.ChatSocketMessageEvent;
import com.example.smartgarage.dto.chat.websocket.ChatSocketReadRequest;
import com.example.smartgarage.dto.chat.websocket.ChatSocketSendMessageRequest;
import com.example.smartgarage.dto.chat.websocket.ChatSocketTypingRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;

@Controller
@Validated
public class ChatWebSocketController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(ChatService chatService,
                                   SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid ChatSocketSendMessageRequest request,
                            Authentication authentication) {
        ChatMessageResponse response = chatService.sendMessage(
                authentication.getName(),
                request.getRoomId(),
                request.getContent()
        );

        ChatSocketMessageEvent event = ChatSocketMessageEvent.created(response);
        messagingTemplate.convertAndSendToUser(authentication.getName(), "/queue/chat.acks", event);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Valid ChatSocketTypingRequest request,
                       Authentication authentication) {
        chatService.validateRoomAccess(authentication.getName(), request.getRoomId());
        User currentUser = chatService.getCurrentUser(authentication.getName());

        ChatSocketMessageEvent event = ChatSocketMessageEvent.typing(
                request.getRoomId(),
                currentUser.getFullName(),
                currentUser.getRole() != null ? currentUser.getRole().name() : null
        );
        messagingTemplate.convertAndSend("/topic/chat.rooms." + request.getRoomId(), event);
    }

    @MessageMapping("/chat.read")
    public void markRoomAsRead(@Valid ChatSocketReadRequest request,
                               Authentication authentication) {
        chatService.markRoomAsRead(authentication.getName(), request.getRoomId());
        User currentUser = chatService.getCurrentUser(authentication.getName());

        ChatSocketMessageEvent event = ChatSocketMessageEvent.roomRead(
                request.getRoomId(),
                currentUser.getFullName(),
                currentUser.getRole() != null ? currentUser.getRole().name() : null,
                LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/chat.rooms." + request.getRoomId(), event);
    }
}
