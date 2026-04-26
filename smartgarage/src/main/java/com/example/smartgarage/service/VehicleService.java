package com.example.smartgarage.service;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.entity.Vehicle;
import com.example.smartgarage.repository.UserRepository;
import com.example.smartgarage.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final Path vehicleUploadDir;

    public VehicleService(
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.vehicleUploadDir = Paths.get(uploadDir, "vehicles").toAbsolutePath().normalize();
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Optional<Vehicle> updateVehicle(Long id, Vehicle vehicleDetails) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setLicensePlate(vehicleDetails.getLicensePlate());
            vehicle.setBrand(vehicleDetails.getBrand());
            vehicle.setModel(vehicleDetails.getModel());
            vehicle.setColor(vehicleDetails.getColor());
            vehicle.setImageUrl(vehicleDetails.getImageUrl());
            vehicle.setType(vehicleDetails.getType());
            return vehicleRepository.save(vehicle);
        });
    }

    public List<Vehicle> getVehiclesByUserId(Long userId) {
        return vehicleRepository.findByUserId(userId);
    }

    public ResponseEntity<?> addVehicle(Long userId, Vehicle vehicle) {
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            vehicle.setUser(user);
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User không tồn tại");
    }

    public ResponseEntity<?> softDeleteVehicle(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Vehicle> vehicleOptional = vehicleRepository.findById(id);
        if (vehicleOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ADMIN".equals(authority.getAuthority()));

        Vehicle vehicle = vehicleOptional.get();
        if (!isAdmin) {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            Long currentUserId = userOptional.get().getId();
            if (vehicle.getUser() == null || !currentUserId.equals(vehicle.getUser().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        vehicle.setIsActive(false);
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    public ResponseEntity<?> uploadVehicleImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng chọn ảnh để tải lên");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Chỉ chấp nhận file hình ảnh");
        }

        String originalFilename = StringUtils.cleanPath(
                Optional.ofNullable(file.getOriginalFilename()).orElse("vehicle-image")
        );
        String extension = "";
        int extensionIndex = originalFilename.lastIndexOf('.');
        if (extensionIndex >= 0) {
            extension = originalFilename.substring(extensionIndex);
        }

        String savedFilename = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(vehicleUploadDir);
            Path targetFile = vehicleUploadDir.resolve(savedFilename);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/vehicles/")
                    .path(savedFilename)
                    .toUriString();

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("imageUrl", imageUrl));
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Không thể lưu ảnh xe lúc này");
        }
    }
}
