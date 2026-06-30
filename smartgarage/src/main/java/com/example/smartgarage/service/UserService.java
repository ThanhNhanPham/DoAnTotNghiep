package com.example.smartgarage.service;

import com.example.smartgarage.dto.auth.AuthMeResponse;
import com.example.smartgarage.dto.auth.ChangePasswordRequest;
import com.example.smartgarage.dto.auth.JwtResponse;
import com.example.smartgarage.dto.auth.LoginRequest;
import com.example.smartgarage.dto.auth.RegisterRequest;
import com.example.smartgarage.dto.user.CreateAdminRequest;
import com.example.smartgarage.dto.user.UpdateAccountStatusRequest;
import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.AccountStatus;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BranchRepository;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       BranchRepository branchRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
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
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        userRepository.save(user);
        return "Đăng ký thành công tài khoản: " + user.getEmail();
    }

    public User createAdmin(CreateAdminRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BadRequestException("Email đã tồn tại.");
        }

        Branch branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh không tồn tại."));

        if (!Boolean.TRUE.equals(branch.getIsActive())) {
            throw new BadRequestException("Không thể cấp tài khoản Admin cho chi nhánh đã ngừng hoạt động.");
        }

        User admin = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .province(request.province())
                .ward(request.ward())
                .houseNumber(request.houseNumber())
                .role(Role.ADMIN)
                .branch(branch)
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        return userRepository.save(admin);
    }

    public User updateAccountStatus(Long id, UpdateAccountStatusRequest request, String currentUserEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        if (targetUser.getRole() == Role.SUPERADMIN) {
            throw new ForbiddenException("Không thể thay đổi trạng thái tài khoản Super Admin.");
        }

        if (targetUser.getEmail().equalsIgnoreCase(currentUserEmail)
                && request.accountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Không thể tự khóa hoặc vô hiệu hóa tài khoản đang đăng nhập.");
        }

        targetUser.setAccountStatus(request.accountStatus());
        targetUser.setIsActive(request.accountStatus() == AccountStatus.ACTIVE);
        return userRepository.save(targetUser);
    }

    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không chính xác!"));

        if (user.getAccountStatus() != AccountStatus.ACTIVE || Boolean.FALSE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị khóa hoặc ngừng hoạt động.");
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
                user.getFullName(),
                user.getBranch() != null ? user.getBranch().getId() : null,
                user.getBranch() != null ? user.getBranch().getName() : null
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
                user.getMembershipTier(),
                user.getBranch() != null ? user.getBranch().getId() : null,
                user.getBranch() != null ? user.getBranch().getName() : null
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
