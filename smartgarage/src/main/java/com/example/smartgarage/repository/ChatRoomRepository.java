package com.example.smartgarage.repository;

import com.example.smartgarage.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByBookingId(Long bookingId);

    @Query("""
            SELECT r FROM ChatRoom r
            WHERE r.customer.id = :customerId
              AND r.hiddenForCustomer = false
            ORDER BY COALESCE(r.lastMessageAt, r.createdAt) DESC, r.id DESC
            """)
    List<ChatRoom> findRoomsForCustomer(@Param("customerId") Long customerId);

    @Query("""
            SELECT r FROM ChatRoom r
            WHERE r.branch.id = :branchId
              AND r.hiddenForAdmin = false
            ORDER BY COALESCE(r.lastMessageAt, r.createdAt) DESC, r.id DESC
            """)
    List<ChatRoom> findRoomsForBranch(@Param("branchId") Long branchId);

    @Query("""
            SELECT r FROM ChatRoom r
            WHERE r.hiddenForSuperadmin = false
            ORDER BY COALESCE(r.lastMessageAt, r.createdAt) DESC, r.id DESC
            """)
    List<ChatRoom> findAllRoomsOrdered();
}
