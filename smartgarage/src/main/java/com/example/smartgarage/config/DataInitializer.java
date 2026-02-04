package com.example.smartgarage.config;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.management.relation.RoleStatus;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Kiểm tra xem đã có tài khoản Super Admin chưa để tránh tạo trùng
            if (userRepository.findByEmail("admin@smartgarage.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@smartgarage.com");
                admin.setFullName("Trùm Hệ Thống");
                admin.setPassword(passwordEncoder.encode("123456")); // Mã hóa mật khẩu
                admin.setRole(Role.SUPERADMIN); // Sử dụng Enum mới
                admin.setPhone("0988888888");
                userRepository.save(admin);
                System.out.println(">>> Đã tạo tài khoản SUPERADMIN mặc định: admin@smartgarage.com /123456");
            }
        };
    }
}
