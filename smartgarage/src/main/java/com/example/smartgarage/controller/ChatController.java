package com.example.smartgarage.controller;

import com.example.smartgarage.dto.chat.ChatMessageRequest;
import com.example.smartgarage.dto.chat.ChatMessageResponse;
import com.example.smartgarage.dto.chat.ChatRoomRequest;
import com.example.smartgarage.dto.chat.ChatRoomResponse;
import com.example.smartgarage.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Chat API", description = "Chat giữa khách hàng và admin chi nhánh")
@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'SUPERADMIN')")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @Operation(summary = "Lấy danh sách phòng chat của người dùng hiện tại")
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getRooms(Authentication authentication) {
        return ResponseEntity.ok(chatService.getRoomsForCurrentUser(authentication.getName()));
    }

    @Operation(summary = "Tạo hoặc lấy phòng chat theo booking")
    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomResponse> createOrGetRoom(@Valid @RequestBody ChatRoomRequest request,
                                                            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createOrGetRoom(authentication.getName(), request.getBookingId()));
    }

    @Operation(summary = "Lấy danh sách tin nhắn trong phòng chat")
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable Long roomId,
                                                                 Authentication authentication) {
        return ResponseEntity.ok(chatService.getMessages(authentication.getName(), roomId));
    }

    @Operation(summary = "Gửi tin nhắn trong phòng chat")
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(@PathVariable Long roomId,
                                                           @Valid @RequestBody ChatMessageRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(authentication.getName(), roomId, request.getContent()));
    }

    @Operation(summary = "Đánh dấu tất cả tin nhắn trong phòng chat là đã đọc")
    @PutMapping("/rooms/{roomId}/read")
    public ResponseEntity<Map<String, String>> markRoomAsRead(@PathVariable Long roomId,
                                                              Authentication authentication) {
        chatService.markRoomAsRead(authentication.getName(), roomId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tin nhắn là đã đọc"));
    }
}
