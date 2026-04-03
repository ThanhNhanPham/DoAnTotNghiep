package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Part;
import com.example.smartgarage.repository.PartRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Part API", description = "Quản lý xe linh kiện của cửa hàng")
@RestController
@RequestMapping("/api/v1/parts")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
public class PartController {
    private final PartRepository partRepository;
    public PartController(PartRepository partRepository) {
        this.partRepository = partRepository;
    }


    @Operation(summary="Admin lấy danh sách quản lý linh kiện")
    @GetMapping
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partRepository.findAll());
    }
    @Operation(summary="Tìm kiếm linh kiện theo tên")
    @GetMapping("/search")
    public ResponseEntity<List<Part>> searchParts(@RequestParam String name) {
        return ResponseEntity.ok(partRepository.findByNameContainingIgnoreCase(name));
    }

    @Operation(summary="Thêm linh kiện mới vào hệ thống")
    @PostMapping
    public ResponseEntity<Part> addPart(@Valid @RequestBody Part part) {
        return ResponseEntity.ok(partRepository.save(part));
    }

    @Operation(summary="Cập nhật thông tin linh kiện")
    @PutMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id,@Valid @RequestBody Part partDetails) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy linh kiện ID: " + id));

        part.setName(partDetails.getName());
        part.setPrice(partDetails.getPrice());
        part.setDescription(partDetails.getDescription());
        part.setUnit(partDetails.getUnit());
        // Không cập nhật trực tiếp quantity ở đây để tránh sai lệch kho

        return ResponseEntity.ok(partRepository.save(part));
    }
    @Operation(summary="api nhập lih kiện vào kho")
    @PatchMapping("/{id}/add-stock")
    public ResponseEntity<Part> addStock(@PathVariable Long id, @RequestParam Integer amount) {
        if(amount <= 0) {
            throw new RuntimeException("Số lượng nhập phải lớn hơn 0");
        }
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy linh kiện"));

        part.setQuantity(part.getQuantity() + amount);
        return ResponseEntity.ok(partRepository.save(part));
    }
    @Operation(summary="Api cảnh báo linh kiện kho sắp hết")
    @GetMapping("/low-stock")
    public ResponseEntity<List<Part>> getLowStock() {
        return ResponseEntity.ok(partRepository.findLowStockParts(5));
    }
}
