package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Vehicle;
import com.example.smartgarage.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Vehicle API", description = "Quản lý xe của khách hàng")
@RestController
@RequestMapping("/api/v1/vehicles")
@CrossOrigin("*")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @Operation(summary="admin lấy danh sách xe của hệ thống")
    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @Operation(summary="khách hàng cập nhật thông tin xe")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @Valid @RequestBody Vehicle vehicleDetails) {
        return vehicleService.updateVehicle(id, vehicleDetails)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary="Lấy thông tin xe theo userId")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Vehicle>> getVehiclesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByUserId(userId));
    }

    @Operation(summary="User thêm thông tin xe")
    @PostMapping("/user/{userId}")
    public ResponseEntity<?> addVehicle(@PathVariable Long userId, @Valid @RequestBody Vehicle vehicle) {
        return vehicleService.addVehicle(userId, vehicle);
    }

    @Operation(summary = "Tải ảnh xe lên")
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadVehicleImage(@RequestParam("file") MultipartFile file) {
        return vehicleService.uploadVehicleImage(file);
    }

    @Operation(summary="xoá xe khỏi hệ thống", description="nếu như xoá xe thì chuyển trạng thái active = false")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        return vehicleService.softDeleteVehicle(id);
    }
}
