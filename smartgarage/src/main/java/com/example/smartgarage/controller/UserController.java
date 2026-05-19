package com.example.smartgarage.controller;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "User API", description = "Quản lý danh sách người dùng")
@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary="admin lấy danh sách người dùng theo id ")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary="admin lấy danh sách tất cả người dùng")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @Operation(summary="update thông tin người dùng")
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,@Valid @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setFullName(userDetails.getFullName());
            user.setPhone(userDetails.getPhone());
            user.setHouseNumber(userDetails.getHouseNumber());
            user.setWard(userDetails.getWard());
            user.setProvince(userDetails.getProvince());
            // Không nên cho phép update Email hoặc Password tại đây để bảo mật
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary="admin xóa người dùng")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
