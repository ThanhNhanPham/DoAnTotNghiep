package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.repository.BranchRepository;
import com.example.smartgarage.repository.MechanicRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Tag(name = "Mechanic", description = "Quản lý thợ sửa xe")
@RestController
@RequestMapping("/api/v1/mechanics")
@CrossOrigin("*")
public class MechanicController {
    @Autowired
    private MechanicRepository mechanicRepository;
    @Autowired
    private BranchRepository branchRepository;
    // Lấy tất cả thợ trong hệ thống
    @GetMapping
    public List<Mechanic> getAllMechanics() {
        return mechanicRepository.findAll();
    }
    // 2. Lấy danh sách thợ theo chi nhánh (Phục vụ chức năng phân công thợ)
    @GetMapping("/branch/{branchId}")
    public List<Mechanic> getMechanicsByBranch(@PathVariable Long branchId) {
        return mechanicRepository.findByBranchId(branchId);
    }

    // 3. Thêm mới một thợ sửa xe vào chi nhánh cụ thể
    @PostMapping("/branch/{branchId}")
    public ResponseEntity<?> createMechanic(@PathVariable Long branchId,@Valid @RequestBody Mechanic mechanic) {
        return branchRepository.findById(branchId).map(branch -> {
            mechanic.setBranch(branch);
            return ResponseEntity.ok(mechanicRepository.save(mechanic));
        }).orElse(ResponseEntity.notFound().build());
    }
    // 4. Cập nhật trạng thái thợ (Ví dụ: Chuyển sang BUSY khi đang sửa xe)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam MechanicStatus status) {
        return mechanicRepository.findById(id).map(m -> {
            m.setStatus(status);
            return ResponseEntity.ok(mechanicRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
    // Thay vì xóa, chúng ta "ngưng kích hoạt" thợ sửa xe
    @DeleteMapping("/{id}")
    public ResponseEntity<?> softDeleteMechanic(@PathVariable Long id) {
        return mechanicRepository.findById(id).map(mechanic -> {
            // Chuyển trạng thái để thợ không xuất hiện trong danh sách phân công nữa
            mechanic.setStatus(MechanicStatus.INACTIVE);
            mechanicRepository.save(mechanic);
            return ResponseEntity.ok("Đã chuyển trạng thái thợ sang nghỉ việc (INACTIVE).");
        }).orElse(ResponseEntity.notFound().build());
    }
}
