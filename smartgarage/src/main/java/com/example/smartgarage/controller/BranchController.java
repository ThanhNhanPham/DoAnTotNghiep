package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.repository.BranchRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Branch API", description = "Quản lý chi nhánh cửa hàng")
@RestController
@RequestMapping("/api/v1/branches")
public class BranchController {
    private final BranchRepository branchRepository;

    public BranchController(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }
    @Operation(summary="Lấy tất cả chi nhánh của cửa hàng")
    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches= branchRepository.findAll();
        return ResponseEntity.ok().body(branches);
    }

    @Operation(summary="Lấy các cửa hàng còn hoạt động")
    @GetMapping("/active")
    public ResponseEntity<List<Branch>> getActiveBranches() {
        List<Branch> branches= branchRepository.findAllByIsActiveTrue();
        return ResponseEntity.ok().body(branches);
    }
    @Operation(summary="Thêm chi nhánh cửa hàng mới")
    @PostMapping
    public ResponseEntity<Branch> createBranch(@Valid @RequestBody Branch branch) {
        try {
            Branch savedBranch = branchRepository.save(branch);
            return new ResponseEntity<>(savedBranch, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary="Cập nhật chi nhánh cửa hàng")
    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id,@Valid @RequestBody Branch branchDetails) {
        try {
            // 1. Tìm chi nhánh cũ trong Database
            return branchRepository.findById(id).map(existingBranch -> {

                // 2. Cập   nhật các thông tin mới từ branchDetails gửi lên
                existingBranch.setName(branchDetails.getName());
                existingBranch.setAddress(branchDetails.getAddress());
                existingBranch.setPhone(branchDetails.getPhone());
                existingBranch.setImageUrl(branchDetails.getImageUrl());
                existingBranch.setIsActive(branchDetails.getIsActive());

                // 3. Lưu lại vào DB
                Branch updatedBranch = branchRepository.save(existingBranch);
                return new ResponseEntity<>(updatedBranch, HttpStatus.OK);

            }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // Trả về 404 nếu không tìm thấy ID

        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary="Xoá chi nhánh cửa hàng", description="chuyển active từ true sang false")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deactivateBranch(@PathVariable Long id) {
        return branchRepository.findById(id).map(branch -> {
            branch.setIsActive(false); // Chuyển trạng thái thành không hoạt động
            branchRepository.save(branch);
            return ResponseEntity.ok("Chi nhánh đã ngưng hoạt động.");
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy chi nhánh với ID: " + id));
    }
}
