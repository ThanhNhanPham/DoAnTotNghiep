package com.example.smartgarage.repository;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleIn(List<Role> roles);
    List<User> findAll();
}
