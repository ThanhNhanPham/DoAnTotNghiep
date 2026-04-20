package com.example.smartgarage.controller;

import com.example.smartgarage.dto.ChangePasswordRequest;
import com.example.smartgarage.dto.JwtResponse;
import com.example.smartgarage.dto.LoginRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.security.JwtTokenProvider;
import com.example.smartgarage.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Auth API", description = "Quản lý đăng ký và đăng nhập")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin("*")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.example.smartgarage.service.UserService userService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider, UserService userService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService= userService;
    }


    @Operation(summary="Api dùng để tạo user mới")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Lỗi: Email đã tồn tại!");
        }

        // Mã hóa mật khẩu trước khi lưu
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Gán role mặc định nếu không có
        if (user.getRole() == null) user.setRole(Role.CUSTOMER);

        userRepository.save(user);
        return ResponseEntity.ok("Đăng ký thành công tài khoản: " + user.getEmail());
    }

    // 2. API ĐĂNG NHẬP (Đã sửa lỗi ResponseEntity)
    @Operation(summary="API dùng để đăng nhập")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        // Tìm user theo email
        var userOptional = userRepository.findByEmail(loginRequest.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // Kiểm tra mật khẩu
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // Tạo token
                String token = jwtTokenProvider.generateToken(user.getEmail());

                // Trả về DTO JwtResponse (token, email, role, userId,address)
                return ResponseEntity.ok(new JwtResponse(token, user.getEmail(), user.getRole().name(),user.getId(),user.getFullAddress(),user.getFullName()));
            }
        }
        // Nếu không khớp email hoặc mật khẩu
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Email hoặc mật khẩu không chính xác!");
    }

    @Operation(summary="api test mật khẩu")
    @PostMapping("/debug-password")
    public ResponseEntity<?> debugPassword(@RequestBody LoginRequest request) {
        Map<String, Object> result = new HashMap<>();

        userRepository.findByEmail(request.getEmail()).ifPresentOrElse(user -> {
            boolean isMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());

            result.put("email", user.getEmail());
            result.put("inputPassword", request.getPassword());
            result.put("dbEncodedPassword", user.getPassword());
            result.put("dbPasswordLength", user.getPassword().length());
            result.put("isMatch", isMatch);

            if (!isMatch && user.getPassword().length() < 60) {
                result.put("error_hint", "Cảnh báo: Độ dài mật khẩu trong DB < 60 ký tự. Có thể cột bị cắt!");
            }
        }, () -> result.put("error", "Không tìm thấy User này trong database"));
        return ResponseEntity.ok(result);
    }

    //4. Api đổi mật khẩu
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetails userDetails, // Lấy user từ Token
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changedPassword(userDetails.getUsername(), request);
        return ResponseEntity.ok("Đổi mật khẩu thành công.");
    }

}