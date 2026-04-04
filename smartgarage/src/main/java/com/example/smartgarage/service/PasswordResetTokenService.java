package com.example.smartgarage.service;

import com.example.smartgarage.entity.PasswordResetToken;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.PasswordResetTokenRepository;
import com.example.smartgarage.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PasswordResetTokenService {
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
                .orElseThrow(()-> new RuntimeException("Không tìm thấy người dùng với email: " + email));
        // xóa token cũ nếu có
        tokenRepository.deleteByToken(user);
        //Tạo token ngâu nhiên
        String token = java.util.UUID.randomUUID().toString();
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
    public void resetPassword(String token, String newPassword) {
        // Kiểm tra token có tồn tại không
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Mã xác nhận không hợp lệ."));

        // Kiểm tra thời hạn của token
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Mã xác nhận đã hết hạn.");
        }
        // Cập nhật mật khẩu mới cho User
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword)); // Mã hóa BCrypt
        userRepository.save(user);
        // Xóa token sau khi sử dụng thành công
        tokenRepository.delete(resetToken);
    }

}
