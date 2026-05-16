package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Part;
import com.example.smartgarage.service.PartService;
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
    private final PartService partService;
    public PartController(PartService partService) {
        this.partService = partService;
    }

    @Operation(summary="Admin lấy danh sách quản lý linh kiện")
    @GetMapping
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partService.findAll());
    }

    @Operation(summary="Admin lấy thông tin chi tiết linh kiện theo id")
    @GetMapping("/{id}")
    public ResponseEntity<Part> getPartById(@PathVariable Long id) {
        Part result = partService.findById(id);
        return ResponseEntity.ok(result);
    }
    @Operation(summary="Tìm kiếm linh kiện theo tên")
    @GetMapping("/search")
    public ResponseEntity<List<Part>> searchParts(@RequestParam String name) {
        List<Part> parts= partService.findByNameContainingIgnoreCase(name);
        return ResponseEntity.ok(parts);
    }

    @Operation(summary="Thêm linh kiện mới vào hệ thống")
    @PostMapping
    public ResponseEntity<Part> addPart(@Valid @RequestBody Part part) {
        return ResponseEntity.ok(partService.save(part));
    }

    @Operation(summary="Cập nhật thông tin linh kiện")
    @PutMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id,@Valid @RequestBody Part partDetails) {
        return ResponseEntity.ok(partService.updatePart(id, partDetails));
    }
    @Operation(summary="api nhập lih kiện vào kho")
    @PatchMapping("/{id}/add-stock")
    public ResponseEntity<Part> addStock(@PathVariable Long id, @RequestParam Integer amount) {
        return ResponseEntity.ok(partService.addStock(id, amount));
    }
    @Operation(summary="Api cảnh báo linh kiện kho sắp hết")
    @GetMapping("/low-stock")
    public ResponseEntity<List<Part>> getLowStock() {
        return ResponseEntity.ok(partService.findLowStockParts(5));
    }
}
