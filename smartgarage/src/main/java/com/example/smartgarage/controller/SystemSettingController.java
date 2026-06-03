package com.example.smartgarage.controller;

import com.example.smartgarage.dto.system.SystemSettingOptionsResponse;
import com.example.smartgarage.dto.system.SystemSettingPatchRequest;
import com.example.smartgarage.dto.system.SystemSettingRequest;
import com.example.smartgarage.dto.system.SystemSettingResponse;
import com.example.smartgarage.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/settings")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
@Tag(name = "System Settings API", description = "Quản lý cài đặt hệ thống cho admin")
@CrossOrigin("*")
public class SystemSettingController {
    private final SystemSettingService systemSettingService;

    public SystemSettingController(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @Operation(summary = "Lấy cài đặt hệ thống")
    @GetMapping
    public ResponseEntity<SystemSettingResponse> getSystemSettings() {
        return ResponseEntity.ok(systemSettingService.getSystemSettings());
    }

    @Operation(summary = "Lấy metadata cho màn hình cài đặt")
    @GetMapping("/options")
    public ResponseEntity<SystemSettingOptionsResponse> getSystemSettingOptions() {
        return ResponseEntity.ok(systemSettingService.getSystemSettingOptions());
    }

    @Operation(summary = "Cập nhật toàn bộ cài đặt hệ thống")
    @PutMapping
    public ResponseEntity<SystemSettingResponse> updateSystemSettings(@Valid @RequestBody SystemSettingRequest request,
                                                                      Authentication authentication) {
        return ResponseEntity.ok(systemSettingService.updateSystemSettings(request, authentication));
    }

    @Operation(summary = "Cập nhật một phần cài đặt hệ thống")
    @PatchMapping
    public ResponseEntity<SystemSettingResponse> patchSystemSettings(@Valid @RequestBody SystemSettingPatchRequest request,
                                                                     Authentication authentication) {
        return ResponseEntity.ok(systemSettingService.patchSystemSettings(request, authentication));
    }

    @Operation(summary = "Khôi phục cài đặt mặc định")
    @PostMapping("/reset")
    public ResponseEntity<SystemSettingResponse> resetSystemSettings(Authentication authentication) {
        return ResponseEntity.ok(systemSettingService.resetSystemSettings(authentication));
    }
}
