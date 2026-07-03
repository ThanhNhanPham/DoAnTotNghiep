package com.example.smartgarage.controller;

import com.example.smartgarage.dto.user.CreateAdminRequest;
import com.example.smartgarage.dto.user.UpdateAccountStatusRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "User API", description = "Quản lý danh sách người dùng")
@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin("*")
public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Operation(summary="admin lấy danh sách người dùng theo id ")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary="admin lấy danh sách tất cả người dùng")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @Operation(summary = "Super Admin tạo tài khoản Admin cho chi nhánh")
    @PostMapping("/admins")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return new ResponseEntity<>(userService.createAdmin(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Super Admin cập nhật trạng thái tài khoản")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<User> updateAccountStatus(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateAccountStatusRequest request,
                                                    Authentication authentication) {
        return ResponseEntity.ok(userService.updateAccountStatus(id, request, authentication.getName()));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
