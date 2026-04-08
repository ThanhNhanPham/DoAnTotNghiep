package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.repository.BranchRepository;
import com.example.smartgarage.repository.MechanicRepository;
import com.example.smartgarage.service.MechanicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Tag(name = "Mechanic API", description = "Quản lý thợ sửa xe")
@RestController
@RequestMapping("/api/v1/mechanics")
@CrossOrigin("*")
public class MechanicController {

    private final MechanicRepository mechanicRepository;
    private final BranchRepository branchRepository;
    private final MechanicService mechanicService;

    public MechanicController(MechanicRepository mechanicRepository, BranchRepository branchRepository, MechanicService mechanicService) {
        this.mechanicService = mechanicService;
        this.mechanicRepository = mechanicRepository;
        this.branchRepository = branchRepository;
    }

    @Operation(summary="Lấy danh sách tất cả thợ trong hệ thống")
    @GetMapping
    public ResponseEntity<List<Mechanic>> getAllMechanics() {
        List<Mechanic>  mechanics = mechanicRepository.findAll();
        return  ResponseEntity.ok().body(mechanics);
    }

    @Operation(summary="Lấy danh sách thợ theo chi nhánh")
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Mechanic>> getMechanicsByBranch(@PathVariable Long branchId) {
        List<Mechanic> mechanics=mechanicRepository.findByBranchId(branchId);
        return  ResponseEntity.ok().body(mechanics);
    }

    @Operation(summary="Thêm một thợ sửa xe vào chi nhánh cụ thể")
    @PostMapping("/branch/{branchId}")
    public ResponseEntity<?> createMechanic(@PathVariable Long branchId,@Valid @RequestBody Mechanic mechanic) {
        return branchRepository.findById(branchId).map(branch -> {
            mechanic.setBranch(branch);
            return ResponseEntity.ok(mechanicRepository.save(mechanic));
        }).orElse(ResponseEntity.notFound().build());
    }
    @Operation(summary="Cập nhật trạng thái thợ")
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam MechanicStatus status) {
        return mechanicRepository.findById(id).map(m -> {
            m.setStatus(status);
            return ResponseEntity.ok(mechanicRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
    @Operation(summary="chuyển trạng thái thợ sửa xe sang đã nghỉ việc")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> softDeleteMechanic(@PathVariable Long id) {
        return mechanicRepository.findById(id).map(mechanic -> {
            // Chuyển trạng thái để thợ không xuất hiện trong danh sách phân công nữa
            mechanic.setStatus(MechanicStatus.INACTIVE);
            mechanicRepository.save(mechanic);
            return ResponseEntity.ok("Đã chuyển trạng thái thợ sang nghỉ việc (INACTIVE).");
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "cập nhật thợ sửa xe")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMechanic(@PathVariable Long id, @Valid @RequestBody Mechanic updatedMechanic) {
        Mechanic result = mechanicService.updateMechanic(id, updatedMechanic);
        return ResponseEntity.ok(result);
    }
}
