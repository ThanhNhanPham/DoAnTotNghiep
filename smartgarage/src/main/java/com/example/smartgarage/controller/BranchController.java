package com.example.smartgarage.controller;

import com.example.smartgarage.dto.BranchNearbyResponse;
import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.service.AdminScopeService;
import com.example.smartgarage.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Branch API", description = "Quản lý chi nhánh cửa hàng")
@RestController
@RequestMapping("/api/v1/branches")
@Validated
public class BranchController {
    private final BranchService branchService;
    private final AdminScopeService adminScopeService;

    public BranchController(BranchService branchService, AdminScopeService adminScopeService) {
        this.branchService = branchService;
        this.adminScopeService = adminScopeService;
    }
    @Operation(summary="Lấy tất cả chi nhánh của cửa hàng")
    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches= branchService.getAllBranches();
        return ResponseEntity.ok().body(branches);
    }

    @Operation(summary="Lấy thông tin chi tiết của một chi nhánh cửa hàng")
    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        Branch result = branchService.getBranchById(id);
        return ResponseEntity.ok().body(result);
    }

    @Operation(summary="Lấy các cửa hàng còn hoạt động")
    @GetMapping("/active")
    public ResponseEntity<List<Branch>> getActiveBranches() {
        List<Branch> branches= branchService.getActiveBranches();
        return ResponseEntity.ok().body(branches);
    }

    @Operation(summary = "Lấy danh sách chi nhánh đang hoạt động gần vị trí người dùng nhất")
    @GetMapping("/active/nearby")
    public ResponseEntity<List<BranchNearbyResponse>> getNearbyActiveBranches(
            @RequestParam
            @DecimalMin(value = "-90.0", inclusive = true, message = "Vĩ độ phải nằm trong khoảng -90 đến 90")
            @DecimalMax(value = "90.0", inclusive = true, message = "Vĩ độ phải nằm trong khoảng -90 đến 90")
            double latitude,
            @RequestParam
            @DecimalMin(value = "-180.0", inclusive = true, message = "Kinh độ phải nằm trong khoảng -180 đến 180")
            @DecimalMax(value = "180.0", inclusive = true, message = "Kinh độ phải nằm trong khoảng -180 đến 180")
            double longitude) {
        return ResponseEntity.ok(branchService.getNearbyActiveBranches(latitude, longitude));
    }
    @Operation(summary="Thêm chi nhánh cửa hàng mới cho hệ thống")
    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Branch> createBranch(@Valid @RequestBody Branch branch) {
        Branch result = branchService.createBranch(branch);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @Operation(summary="Cập nhật chi nhánh cửa hàng cho hệ thống")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id,
                                               @Valid @RequestBody Branch branchDetails,
                                               Authentication authentication) {
        adminScopeService.ensureBranchAccess(authentication, id);
        return branchService.updateBranch(id, branchDetails)
                .map(updatedBranch -> new ResponseEntity<>(updatedBranch, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @Operation(summary="Xoá chi nhánh cửa hàng", description="chuyển active từ true sang false")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> deactivateBranch(@PathVariable Long id) {
        branchService.deactivateBranch(id);
        return ResponseEntity.ok(Map.of("message","Chi nhánh đã ngưng hoạt động."));
    }
}
