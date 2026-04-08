package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Motorbike;
import com.example.smartgarage.service.MotorbikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Motorbike API", description = "Quản lý xe của khách hàng")
@RestController
@RequestMapping("/api/v1/motorbikes")
@CrossOrigin("*")
public class MotorbikeController {

    private final MotorbikeService motorbikeService;

    public MotorbikeController(MotorbikeService motorbikeService) {
        this.motorbikeService = motorbikeService;
    }

    @Operation(summary="admin lấy danh sách xe của hệ thống")
    @GetMapping
    public ResponseEntity<List<Motorbike>> getAllMotorbikes() {
        return ResponseEntity.ok(motorbikeService.getAllMotorbikes());
    }

    @Operation(summary="khách hàng cập nhật thông tin xe")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMotorbike(@PathVariable Long id, @Valid @RequestBody Motorbike motorbikeDetails) {
        return motorbikeService.updateMotorbike(id, motorbikeDetails)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary="Lấy thông tin xe máy theo userId")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Motorbike>> getMotorbikesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(motorbikeService.getMotorbikesByUserId(userId));
    }

    @Operation(summary="User thêm thông tin xe máy")
    @PostMapping("/user/{userId}")
    public ResponseEntity<?> addMotorbike(@PathVariable Long userId,@Valid @RequestBody Motorbike motorbike) {
        return motorbikeService.addMotorbike(userId, motorbike);
    }
    @Operation(summary="xoá xe máy khỏi hệ thống", description="nếu như xoá xe máy thì chuyển trạng thái active = false")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMotorbike(@PathVariable Long id) {
        return motorbikeService.softDeleteMotorbike(id);
    }
}
