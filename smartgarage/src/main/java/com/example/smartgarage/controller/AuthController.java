package com.example.smartgarage.controller;

import com.example.smartgarage.dto.auth.ChangePasswordRequest;
import com.example.smartgarage.dto.auth.ForgotPasswordRequest;
import com.example.smartgarage.dto.auth.LoginRequest;
import com.example.smartgarage.dto.auth.RegisterRequest;
import com.example.smartgarage.dto.auth.ResetPasswordRequest;
import com.example.smartgarage.service.PasswordResetTokenService;
import com.example.smartgarage.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Auth API", description = "Quản lý đăng ký và đăng nhập")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
public class AuthController {
    private final UserService userService;
    private final PasswordResetTokenService passwordResetTokenService;

    public AuthController(UserService userService,
                          PasswordResetTokenService passwordResetTokenService) {
        this.userService = userService;
        this.passwordResetTokenService = passwordResetTokenService;
    }

    @Operation(summary = "Api dùng để tạo user mới")
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", message));
    }

    @Operation(summary = "API dùng để đăng nhập")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.login(loginRequest));
    }

    @Operation(summary = "Lấy thông tin user hiện tại")
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    @Operation(summary = "API dùng để đổi mật khẩu cho user đã đăng nhập")
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changedPassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công."));
    }

    @Operation(summary = "Gửi mã xác nhận quên mật khẩu qua email")
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetTokenService.requestPassReset(request.email());
        return ResponseEntity.ok(Map.of("message", "Mã xác nhận đặt lại mật khẩu đã được gửi về email."));
    }

    @Operation(summary = "Đặt lại mật khẩu bằng mã xác nhận")
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetTokenService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công."));
    }
}
