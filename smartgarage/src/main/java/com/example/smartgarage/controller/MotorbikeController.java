package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Motorbike;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.MotorbikeRepository;
import com.example.smartgarage.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Tag(name = "Motorbike", description = "Quản lý xe của khách hàng")
@RestController
@RequestMapping("/api/v1/motorbikes")
@CrossOrigin("*")
public class MotorbikeController {
    @Autowired
    private MotorbikeRepository motorbikeRepository;
    @Autowired
    private UserRepository userRepository;
    // 1. Lấy danh sách xe của một User cụ thể
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Motorbike>> getMotorbikesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(motorbikeRepository.findByUserId(userId));
    }
    // 2. Thêm xe mới cho User
    @PostMapping("/user/{userId}")
    public ResponseEntity<?> addMotorbike(@PathVariable Long userId,@Valid @RequestBody Motorbike motorbike) {
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            motorbike.setUser(user);
            Motorbike savedMotorbike = motorbikeRepository.save(motorbike);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMotorbike);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User không tồn tại");
        }
    }
    // 3. Xóa xe máy khỏi hệ thống
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMotorbike(@PathVariable Long id) {
        return motorbikeRepository.findById(id).map(motorbike -> {
            motorbikeRepository.delete(motorbike);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
