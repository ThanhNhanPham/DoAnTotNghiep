package com.example.smartgarage.service;

import com.example.smartgarage.dto.auth.AuthMeResponse;
import com.example.smartgarage.dto.auth.ChangePasswordRequest;
import com.example.smartgarage.dto.auth.JwtResponse;
import com.example.smartgarage.dto.auth.LoginRequest;
import com.example.smartgarage.dto.auth.RegisterRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BadRequestException("Lỗi: Email đã tồn tại!");
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
        return "Đăng ký thành công tài khoản: " + user.getEmail();
    }

    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không chính xác!"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hóa.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác!");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new JwtResponse(
                token,
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getFullAddress(),
                user.getFullName()
        );
    }

    public AuthMeResponse getCurrentUser(String email) {
        User user = getUserByEmail(email);

        return new AuthMeResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFullName(),
                user.getPhone(),
                user.getFullAddress(),
                user.getIsActive(),
                user.getLoyaltyPoints(),
                user.getMembershipTier()
        );
    }

    public void changedPassword(String email, ChangePasswordRequest request) {
        User user = getUserByEmail(email);
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không khớp.");
        }
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu cũ không đúng");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Người dùng không tồn tại."));
    }
}
