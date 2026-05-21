package com.example.smartgarage.controller;

import com.example.smartgarage.dto.auth.AuthMeResponse;
import com.example.smartgarage.dto.auth.ChangePasswordRequest;
import com.example.smartgarage.dto.auth.ForgotPasswordRequest;
import com.example.smartgarage.dto.auth.JwtResponse;
import com.example.smartgarage.dto.auth.LoginRequest;
import com.example.smartgarage.dto.auth.RegisterRequest;
import com.example.smartgarage.dto.auth.ResetPasswordRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.security.JwtTokenProvider;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@Tag(name = "Auth API", description = "Quản lý đăng ký và đăng nhập")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final PasswordResetTokenService passwordResetTokenService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider,
                          UserService userService,
                          PasswordResetTokenService passwordResetTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        this.passwordResetTokenService = passwordResetTokenService;
    }

    @Operation(summary = "Api dùng để tạo user mới")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Lỗi: Email đã tồn tại!");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .province(request.province())
                .ward(request.ward())
                .houseNumber(request.houseNumber())
                .role(Role.CUSTOMER)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();

        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Đăng ký thành công tài khoản: " + user.getEmail()));
    }

    @Operation(summary = "API dùng để đăng nhập")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        var userOptional = userRepository.findByEmail(loginRequest.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (Boolean.FALSE.equals(user.getIsActive())) {
                throw new BadRequestException("Tài khoản đã bị vô hiệu hóa.");
            }

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtTokenProvider.generateToken(user.getEmail());
                return ResponseEntity.ok(new JwtResponse(
                        token,
                        user.getEmail(),
                        user.getRole().name(),
                        user.getId(),
                        user.getFullAddress(),
                        user.getFullName()
                ));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Email hoặc mật khẩu không chính xác!");
    }

    @Operation(summary = "Lấy thông tin user hiện tại")
    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BadRequestException("Người dùng không tồn tại."));

        return ResponseEntity.ok(new AuthMeResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName(),
                user.getPhone(),
                user.getFullAddress(),
                user.getIsActive()
        ));
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
