package com.example.smartgarage.service;

import com.example.smartgarage.dto.ChangePasswordRequest;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }
    public void changedPassword(String email, ChangePasswordRequest request){
        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("Người dùng không tồn tại"));
        if(!passwordEncoder.matches(request.oldPassword(), user.getPassword())){
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

}
