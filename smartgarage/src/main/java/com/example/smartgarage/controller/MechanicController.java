package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.service.MechanicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Tag(name = "Mechanic API", description = "Quản lý thợ sửa xe")
@RestController
@RequestMapping("/api/v1/mechanics")
@CrossOrigin("*")
public class MechanicController {

    private final MechanicService mechanicService;

    public MechanicController(MechanicService mechanicService) {
        this.mechanicService = mechanicService;
    }

    @Operation(summary="Lấy danh sách tất cả thợ trong hệ thống")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<Mechanic>> getAllMechanics() {
        List<Mechanic>  mechanics = mechanicService.getAllMechanics();
        return  ResponseEntity.ok().body(mechanics);
    }

    @Operation(summary="Lấy danh sách thợ theo chi nhánh")
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<Mechanic>> getMechanicsByBranch(@PathVariable Long branchId) {
        List<Mechanic> mechanics=mechanicService.findByBranchId(branchId);
        return  ResponseEntity.ok().body(mechanics);
    }
    @Operation(summary="Lấy thông tin chi tiết của một thợ sửa xe")
    @GetMapping("/{id}")
    public ResponseEntity<Mechanic> getMechanicById(@PathVariable Long id) {
        Mechanic result = mechanicService.findById(id);
        return   ResponseEntity.ok().body(result);
    }

    @Operation(summary="Thêm một thợ sửa xe vào chi nhánh cụ thể")
    @PostMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Mechanic> createMechanic(@PathVariable Long branchId,@Valid @RequestBody Mechanic mechanic) {
        return ResponseEntity.ok(mechanicService.createMechanic(branchId, mechanic));
    }
    @Operation(summary="Cập nhật trạng thái thợ")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Mechanic> updateStatus(@PathVariable Long id, @RequestParam MechanicStatus status) {
        return ResponseEntity.ok(mechanicService.updateMechanicStatus(id, status));
    }
    @Operation(summary="chuyển trạng thái thợ sửa xe sang đã nghỉ việc")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> softDeleteMechanic(@PathVariable Long id) {
        mechanicService.softDeleteMechanic(id);
        return ResponseEntity.ok("Đã chuyển trạng thái thợ sang nghỉ việc (INACTIVE).");
    }

    @Operation(summary = "cập nhật thợ sửa xe")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Mechanic> updateMechanic(@PathVariable Long id, @Valid @RequestBody Mechanic updatedMechanic) {
        Mechanic result = mechanicService.updateMechanic(id, updatedMechanic);
        return ResponseEntity.ok(result);
    }
}
