package com.example.smartgarage.controller;

import com.example.smartgarage.dto.part.PartRequest;
import com.example.smartgarage.dto.part.PartResponse;
import com.example.smartgarage.entity.Part;
import com.example.smartgarage.service.PartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Part API", description = "Quản lý xe linh kiện của cửa hàng")
@RestController
@RequestMapping("/api/v1/parts")
@CrossOrigin("*")
//@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class PartController {
    private final PartService partService;
    public PartController(PartService partService) {
        this.partService = partService;
    }

    @Operation(summary="Admin lấy danh sách quản lý linh kiện")
    @GetMapping
    public ResponseEntity<Page<Part>> getAllParts(@RequestParam(required = false) String keyword,
                                                  @RequestParam(required = false) String stockStatus,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(partService.findAll(keyword, stockStatus, page, size));
    }

    @Operation(summary="Admin lấy thông tin chi tiết linh kiện theo id")
    @GetMapping("/{id}")
    public ResponseEntity<PartResponse> getPartById(@PathVariable Long id) {
        PartResponse result = partService.findResponseById(id);
        return ResponseEntity.ok(result);
    }
    @Operation(summary="Tìm kiếm linh kiện theo tên")
    @GetMapping("/search")
    public ResponseEntity<List<Part>> searchParts(@RequestParam String name) {
        List<Part> parts= partService.findByNameContainingIgnoreCase(name);
        return ResponseEntity.ok(parts);
    }

    @Operation(summary = "Lấy danh sách linh kiện theo chi nhánh")
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Part>> getPartsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(partService.findByBranchId(branchId));
    }

    @Operation(summary="Thêm linh kiện mới vào chi nhánh")
    @PostMapping("/{branchId}")
    public ResponseEntity<Part> addPartToBranch(@PathVariable Long branchId, @Valid @RequestBody PartRequest request) {
        Part result = partService.addPartToBranch(branchId, request);
        return  ResponseEntity.ok(result);
    }

    @Operation(summary="Cập nhật thông tin linh kiện")
    @PutMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id,@Valid @RequestBody PartRequest request) {
        return ResponseEntity.ok(partService.updatePart(id, request));
    }
    @Operation(summary="api nhập linh kiện vào kho")
    @PatchMapping("/{id}/add-stock")
    public ResponseEntity<Part> addStock(@PathVariable Long id, @RequestParam Integer amount) {
        return ResponseEntity.ok(partService.addStock(id, amount));
    }

    @Operation(summary = "Api xuất bớt linh kiện khỏi kho")
    @PatchMapping("/{id}/remove-stock")
    public ResponseEntity<Part> removeStock(@PathVariable Long id, @RequestParam Integer amount) {
        return ResponseEntity.ok(partService.removeStock(id, amount));
    }

    @Operation(summary = "Xóa linh kiện")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePart(@PathVariable Long id) {
        partService.deletePart(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary="Api cảnh báo linh kiện kho sắp hết")
    @GetMapping("/low-stock")
    public ResponseEntity<List<Part>> getLowStock() {
        return ResponseEntity.ok(partService.findLowStockParts(5));
    }
}
