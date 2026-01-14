package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.repository.BranchRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Branch", description = "Quản lý chi nhánh cửa hàng")
@RestController
@RequestMapping("/api/v1/branches")
public class BranchController {
    @Autowired
    private BranchRepository branchRepository;
    @GetMapping
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    // Thêm chi nhánh cuả hàng
    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        try {
            Branch savedBranch = branchRepository.save(branch);
            return new ResponseEntity<>(savedBranch, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // sửa chi nhánh cửa hàng
    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @RequestBody Branch branchDetails) {
        try {
            // 1. Tìm chi nhánh cũ trong Database
            return branchRepository.findById(id).map(existingBranch -> {

                // 2. Cập nhật các thông tin mới từ branchDetails gửi lên
                existingBranch.setName(branchDetails.getName());
                existingBranch.setAddress(branchDetails.getAddress());
                existingBranch.setPhone(branchDetails.getPhone());
                existingBranch.setImageUrl(branchDetails.getImageUrl());
                existingBranch.setActive(branchDetails.getActive());

                // 3. Lưu lại vào DB
                Branch updatedBranch = branchRepository.save(existingBranch);
                return new ResponseEntity<>(updatedBranch, HttpStatus.OK);

            }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // Trả về 404 nếu không tìm thấy ID

        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Xóa chi nhánh cửa hàng
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBranch(@PathVariable Long id) {
        try {
            // 1. Kiểm tra xem chi nhánh có tồn tại trong DB không
            if (!branchRepository.existsById(id)) {
                return new ResponseEntity<>("Lỗi: Không tìm thấy chi nhánh có ID = " + id, HttpStatus.NOT_FOUND);
            }
            branchRepository.deleteById(id);

            return new ResponseEntity<>("Đã xóa chi nhánh thành công!", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Không thể xóa chi nhánh này vì có dữ liệu liên quan (thợ, lịch hẹn...)",
                    HttpStatus.CONFLICT);
        }
    }
}
