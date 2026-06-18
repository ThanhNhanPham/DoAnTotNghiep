package com.example.smartgarage.repository;

import com.example.smartgarage.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    @Query("""
            SELECT COUNT(m) FROM ChatMessage m
            WHERE m.room.id = :roomId
              AND m.sender.id <> :viewerId
              AND m.isRead = false
            """)
    long countUnreadMessages(@Param("roomId") Long roomId, @Param("viewerId") Long viewerId);

    @Query("""
            SELECT COUNT(m) FROM ChatMessage m
            WHERE m.room.id IN :roomIds
              AND m.sender.id <> :viewerId
              AND m.isRead = false
            GROUP BY m.room.id
            """)
    List<Long> countUnreadGroupedRaw(@Param("roomIds") List<Long> roomIds, @Param("viewerId") Long viewerId);

    ChatMessage findTopByRoomIdOrderByCreatedAtDesc(Long roomId);

    @Modifying
    @Query("""
            UPDATE ChatMessage m
            SET m.isRead = true
            WHERE m.room.id = :roomId
              AND m.sender.id <> :viewerId
              AND m.isRead = false
            """)
    int markRoomMessagesAsRead(@Param("roomId") Long roomId, @Param("viewerId") Long viewerId);
}
