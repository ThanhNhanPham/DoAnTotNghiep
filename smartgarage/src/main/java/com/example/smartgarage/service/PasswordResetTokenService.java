package com.example.smartgarage.service;

import com.example.smartgarage.dto.auth.ResetPasswordRequest;
import com.example.smartgarage.entity.PasswordResetToken;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.repository.PasswordResetTokenRepository;
import com.example.smartgarage.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.security.SecureRandom;

@Service
public class PasswordResetTokenService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailTemplateService emailTemplateService ;
    private final PasswordEncoder passwordEncoder ;

    public PasswordResetTokenService(UserRepository userRepository, PasswordResetTokenRepository tokenRepository, EmailTemplateService emailTemplateService, PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        this.emailTemplateService = emailTemplateService;
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }
    //1 xử lý yêu cầu quên mật khẩu
    @Transactional
    public void requestPassReset(String email){
        // tìm theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email không tồn tại trong hệ thống."));
        // xóa token cũ nếu có
        tokenRepository.deleteByUser(user);
        // Tạo mã xác nhận 6 chữ số
        String token = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        // Lưu token vào DB với thời hạn 15 phút
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(java.time.LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(resetToken);
        // Gửi email chứa link reset (giả sử có EmailService)
         emailTemplateService.sendResetEmail(user.getEmail(), token);
        // emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }
    //2. Xử lý đổi mật khẩu mới
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không khớp.");
        }
        // Kiểm tra token có tồn tại không
        PasswordResetToken resetToken = tokenRepository.findByToken(request.token())
                .orElseThrow(() -> new RuntimeException("Mã xác nhận không hợp lệ."));

        // Kiểm tra thời hạn của token
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Mã xác nhận đã hết hạn.");
        }
        // Cập nhật mật khẩu mới cho User
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword())); // Mã hóa BCrypt
        userRepository.save(user);
        // Xóa token sau khi sử dụng thành công
        tokenRepository.delete(resetToken);
    }

}
