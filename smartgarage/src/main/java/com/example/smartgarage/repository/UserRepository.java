package com.example.smartgarage.repository;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleIn(List<Role> roles);
    List<User> findByRoleAndBranchId(Role role, Long branchId);
    List<User> findAll();

    @Query("""
            SELECT u FROM User u
            WHERE u.role = :role
              AND (
                LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                COALESCE(u.phone, '') LIKE CONCAT('%', :keyword, '%')
              )
            ORDER BY u.createdAt DESC
            """)
    List<User> searchCustomers(@Param("role") Role role, @Param("keyword") String keyword, Pageable pageable);
}
