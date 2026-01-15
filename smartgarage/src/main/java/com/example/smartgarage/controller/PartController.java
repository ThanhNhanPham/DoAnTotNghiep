package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Part;
import com.example.smartgarage.repository.PartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parts")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
public class PartController {
    @Autowired private PartRepository partRepository;

    // 1. Lấy tất cả linh kiện (dành cho Admin quản lý kho)
    @GetMapping
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partRepository.findAll());
    }
    // 2. Tìm kiếm linh kiện theo tên (Dùng khi chọn linh kiện cho đơn hàng)
    @GetMapping("/search")
    public ResponseEntity<List<Part>> searchParts(@RequestParam String name) {
        return ResponseEntity.ok(partRepository.findByNameContainingIgnoreCase(name));
    }

    //3. Thêm mới linh kiện vào hệ thống
    @PostMapping
    public ResponseEntity<Part> addPart(@RequestBody Part part) {
        return ResponseEntity.ok(partRepository.save(part));
    }
    //4.Cập nhật thông tin linh kiện(Giá, tên, mô tả)
    @PutMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id, @RequestBody Part partDetails) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy linh kiện ID: " + id));

        part.setName(partDetails.getName());
        part.setPrice(partDetails.getPrice());
        part.setDescription(partDetails.getDescription());
        part.setUnit(partDetails.getUnit());
        // Không cập nhật trực tiếp quantity ở đây để tránh sai lệch kho

        return ResponseEntity.ok(partRepository.save(part));
    }
    //5.Api nhap linh kien vao kho
    @PatchMapping("/{id}/add-stock")
    public ResponseEntity<Part> addStock(@PathVariable Long id, @RequestParam Integer amount) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy linh kiện"));

        part.setQuantity(part.getQuantity() + amount);
        return ResponseEntity.ok(partRepository.save(part));
    }
    // 6. API Cảnh báo hàng sắp hết (Dành cho Dashboard)
    @GetMapping("/low-stock")
    public ResponseEntity<List<Part>> getLowStock() {
        // Lấy danh sách linh kiện còn dưới 5 cái
        return ResponseEntity.ok(partRepository.findLowStockParts(5));
    }
}
