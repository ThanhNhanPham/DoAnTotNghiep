package com.example.smartgarage.service;

import com.example.smartgarage.entity.Motorbike;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.repository.MotorbikeRepository;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MotorbikeService {

    private final MotorbikeRepository motorbikeRepository;
    private final UserRepository userRepository;

    public MotorbikeService(MotorbikeRepository motorbikeRepository, UserRepository userRepository) {
        this.motorbikeRepository = motorbikeRepository;
        this.userRepository = userRepository;
    }

    public List<Motorbike> getAllMotorbikes() {
        return motorbikeRepository.findAll();
    }

    public Optional<Motorbike> updateMotorbike(Long id, Motorbike motorbikeDetails) {
        return motorbikeRepository.findById(id).map(motorbike -> {
            motorbike.setLicensePlate(motorbikeDetails.getLicensePlate());
            motorbike.setBrand(motorbikeDetails.getBrand());
            motorbike.setModel(motorbikeDetails.getModel());
            motorbike.setColor(motorbikeDetails.getColor());
            return motorbikeRepository.save(motorbike);
        });
    }

    public List<Motorbike> getMotorbikesByUserId(Long userId) {
        return motorbikeRepository.findByUserId(userId);
    }

    public ResponseEntity<?> addMotorbike(Long userId, Motorbike motorbike) {
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            motorbike.setUser(user);
            Motorbike savedMotorbike = motorbikeRepository.save(motorbike);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMotorbike);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User không tồn tại");
    }

    public ResponseEntity<?> softDeleteMotorbike(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Motorbike> motorbikeOptional = motorbikeRepository.findById(id);
        if (motorbikeOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ADMIN".equals(authority.getAuthority()));

        Motorbike motorbike = motorbikeOptional.get();
        if (!isAdmin) {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            Long currentUserId = userOptional.get().getId();
            if (motorbike.getUser() == null || !currentUserId.equals(motorbike.getUser().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        motorbike.setIs_active(false);
        return ResponseEntity.ok(motorbikeRepository.save(motorbike));
    }
}
