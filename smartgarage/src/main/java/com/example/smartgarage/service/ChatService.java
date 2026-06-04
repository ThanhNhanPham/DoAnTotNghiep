package com.example.smartgarage.service;

import com.example.smartgarage.dto.chat.ChatMessageResponse;
import com.example.smartgarage.dto.chat.ChatRoomResponse;
import com.example.smartgarage.dto.chat.websocket.ChatSocketMessageEvent;
import com.example.smartgarage.entity.*;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatRoomRepository chatRoomRepository,
                       ChatMessageRepository chatMessageRepository,
                       BookingRepository bookingRepository,
                       UserRepository userRepository,
                       NotificationRepository notificationRepository,
                       SimpMessagingTemplate messagingTemplate) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getRoomsForCurrentUser(String email) {
        User currentUser = getUserByEmail(email);
        List<ChatRoom> rooms = switch (currentUser.getRole()) {
            case CUSTOMER -> chatRoomRepository.findRoomsForCustomer(currentUser.getId());
            case ADMIN -> {
                Long branchId = requireBranchId(currentUser);
                yield chatRoomRepository.findRoomsForBranch(branchId);
            }
            case SUPERADMIN -> chatRoomRepository.findAllRoomsOrdered();
        };

        return rooms.stream()
                .map(room -> mapRoomToResponse(room, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatRoomResponse createOrGetRoom(String email, Long bookingId) {
        User currentUser = getUserByEmail(email);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));
        validateBookingAccess(currentUser, booking);

        ChatRoom room = chatRoomRepository.findByBookingId(bookingId)
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.builder()
                        .booking(booking)
                        .customer(booking.getUser())
                        .branch(booking.getBranch())
                        .lastMessageAt(null)
                        .build()));

        validateRoomAccess(currentUser, room);
        ChatRoomResponse response = mapRoomToResponse(room, currentUser);
        publishRoomUpdates(room);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(String email, Long roomId) {
        User currentUser = getUserByEmail(email);
        ChatRoom room = getAccessibleRoom(currentUser, roomId);

        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId()).stream()
                .map(this::mapMessageToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(String email, Long roomId, String content) {
        User currentUser = getUserByEmail(email);
        ChatRoom room = getAccessibleRoom(currentUser, roomId);

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(currentUser)
                .senderRole(currentUser.getRole())
                .content(content.trim())
                .isRead(false)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        room.setLastMessageAt(savedMessage.getCreatedAt() != null ? savedMessage.getCreatedAt() : LocalDateTime.now());
        chatRoomRepository.save(room);

        createNotificationsForNewMessage(room, currentUser, savedMessage.getContent());
        publishRoomUpdates(room);
        return mapMessageToResponse(savedMessage);
    }

    @Transactional
    public void markRoomAsRead(String email, Long roomId) {
        User currentUser = getUserByEmail(email);
        ChatRoom room = getAccessibleRoom(currentUser, roomId);
        chatMessageRepository.markRoomMessagesAsRead(room.getId(), currentUser.getId());
        publishRoomUpdates(room);
    }

    @Transactional(readOnly = true)
    public void validateRoomAccess(String email, Long roomId) {
        User currentUser = getUserByEmail(email);
        getAccessibleRoom(currentUser, roomId);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String email) {
        return getUserByEmail(email);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng đăng nhập"));
    }

    private ChatRoom getAccessibleRoom(User currentUser, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng chat ID: " + roomId));
        validateRoomAccess(currentUser, room);
        return room;
    }

    private void validateBookingAccess(User currentUser, Booking booking) {
        if (currentUser.getRole() == Role.CUSTOMER) {
            if (booking.getUser() == null || !Objects.equals(booking.getUser().getId(), currentUser.getId())) {
                throw new ForbiddenException("Bạn không có quyền tạo chat cho booking này.");
            }
            return;
        }

        if (currentUser.getRole() == Role.ADMIN) {
            Long branchId = requireBranchId(currentUser);
            if (booking.getBranch() == null || !Objects.equals(booking.getBranch().getId(), branchId)) {
                throw new ForbiddenException("Bạn không có quyền truy cập booking ngoài chi nhánh của mình.");
            }
        }
    }

    private void validateRoomAccess(User currentUser, ChatRoom room) {
        if (currentUser.getRole() == Role.SUPERADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.CUSTOMER) {
            if (room.getCustomer() == null || !Objects.equals(room.getCustomer().getId(), currentUser.getId())) {
                throw new ForbiddenException("Bạn không có quyền truy cập phòng chat này.");
            }
            return;
        }

        Long branchId = requireBranchId(currentUser);
        if (room.getBranch() == null || !Objects.equals(room.getBranch().getId(), branchId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập phòng chat ngoài chi nhánh của mình.");
        }
    }

    private Long requireBranchId(User user) {
        if (user.getBranch() == null || user.getBranch().getId() == null) {
            throw new ForbiddenException("Tài khoản admin chưa được gán chi nhánh.");
        }
        return user.getBranch().getId();
    }

    private ChatRoomResponse mapRoomToResponse(ChatRoom room, User currentUser) {
        ChatMessage lastMessage = chatMessageRepository.findTopByRoomIdOrderByCreatedAtDesc(room.getId());
        String preview = lastMessage != null ? truncate(lastMessage.getContent(), 120) : null;

        return ChatRoomResponse.builder()
                .id(room.getId())
                .bookingId(room.getBooking() != null ? room.getBooking().getId() : null)
                .bookingStatus(room.getBooking() != null && room.getBooking().getStatus() != null
                        ? room.getBooking().getStatus().name()
                        : null)
                .branchId(room.getBranch() != null ? room.getBranch().getId() : null)
                .branchName(room.getBranch() != null ? room.getBranch().getName() : null)
                .customerId(room.getCustomer() != null ? room.getCustomer().getId() : null)
                .customerName(room.getCustomer() != null ? room.getCustomer().getFullName() : null)
                .customerPhone(room.getCustomer() != null ? room.getCustomer().getPhone() : null)
                .licensePlate(room.getBooking() != null && room.getBooking().getVehicle() != null
                        ? room.getBooking().getVehicle().getLicensePlate()
                        : null)
                .vehicleName(room.getBooking() != null && room.getBooking().getVehicle() != null
                        ? room.getBooking().getVehicle().getBrand() + " " + room.getBooking().getVehicle().getModel()
                        : null)
                .lastMessagePreview(preview)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : room.getLastMessageAt())
                .unreadCount(chatMessageRepository.countUnreadMessages(room.getId(), currentUser.getId()))
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatMessageResponse mapMessageToResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoom() != null ? message.getRoom().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getFullName() : null)
                .senderRole(message.getSenderRole() != null ? message.getSenderRole().name() : null)
                .content(message.getContent())
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void createNotificationsForNewMessage(ChatRoom room, User sender, String content) {
        List<User> recipients = new ArrayList<>();

        if (sender.getRole() == Role.CUSTOMER) {
            if (room.getBranch() != null && room.getBranch().getId() != null) {
                recipients.addAll(userRepository.findByRoleAndBranchId(Role.ADMIN, room.getBranch().getId()));
            }
            recipients.addAll(userRepository.findByRoleIn(List.of(Role.SUPERADMIN)));
        } else if (room.getCustomer() != null) {
            recipients.add(room.getCustomer());
        }

        recipients = recipients.stream()
                .filter(user -> user.getId() != null && !Objects.equals(user.getId(), sender.getId()))
                .distinct()
                .collect(Collectors.toList());

        if (recipients.isEmpty()) {
            return;
        }

        String branchName = room.getBranch() != null ? room.getBranch().getName() : "chi nhánh";
        String senderName = sender.getFullName() != null ? sender.getFullName() : "Người dùng";
        String title = sender.getRole() == Role.CUSTOMER ? "Tin nhắn mới từ khách hàng" : "Tin nhắn mới từ gara";
        String messageContent = sender.getRole() == Role.CUSTOMER
                ? senderName + " vừa gửi tin nhắn cho booking #" + room.getBooking().getId() + " tại " + branchName
                : branchName + " vừa phản hồi booking #" + room.getBooking().getId() + ": " + truncate(content, 80);

        List<Notification> notifications = recipients.stream()
                .map(recipient -> {
                    Notification notification = new Notification();
                    notification.setUser(recipient);
                    notification.setTitle(title);
                    notification.setContent(messageContent);
                    notification.setBookingId(room.getBooking() != null ? room.getBooking().getId() : null);
                    return notification;
                })
                .collect(Collectors.toList());

        notificationRepository.saveAll(notifications);
    }

    private void publishRoomUpdates(ChatRoom room) {
        if (room == null) {
            return;
        }

        List<User> recipients = getRoomRealtimeRecipients(room);
        for (User recipient : recipients) {
            String email = recipient.getEmail();
            if (email == null || email.isBlank()) {
                continue;
            }

            ChatRoomResponse roomResponse = mapRoomToResponse(room, recipient);
            ChatSocketMessageEvent event = ChatSocketMessageEvent.roomUpsert(roomResponse);
            messagingTemplate.convertAndSendToUser(email, "/queue/chat.rooms", event);
        }
    }

    private List<User> getRoomRealtimeRecipients(ChatRoom room) {
        List<User> recipients = new ArrayList<>();

        if (room.getCustomer() != null) {
            recipients.add(room.getCustomer());
        }

        if (room.getBranch() != null && room.getBranch().getId() != null) {
            recipients.addAll(userRepository.findByRoleAndBranchId(Role.ADMIN, room.getBranch().getId()));
        }

        recipients.addAll(userRepository.findByRoleIn(List.of(Role.SUPERADMIN)));

        return recipients.stream()
                .filter(user -> user.getId() != null)
                .distinct()
                .collect(Collectors.toList());
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
