package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Service;
import com.example.smartgarage.repository.ServiceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Service API", description = "Quản lý dịch vụ sửa chữa")
@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {

    private final ServiceRepository serviceRepository;
    public ServiceController(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    @Operation(summary="lấy danh sách tất cả các service của cửa hàng")
    @GetMapping
    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    @Operation(summary="thêm dịch vụ mới cho cửa hàng")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Service> createService(@Valid @RequestBody Service service) {
        try {
            Service savedService = serviceRepository.save(service);
            return new ResponseEntity<>(savedService, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary="chỉnh sửa dịch vụ của cửa hàng")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Service> updateService(@PathVariable Long id,@Valid @RequestBody Service service){
        try {
            // 1. Tìm dịch vụ cũ trong Database
            return serviceRepository.findById(id).map(existingService -> {

                // 2. Cập nhật các thông tin mới từ serviceDetails gửi lên
                existingService.setName(service.getName());
                existingService.setDescription(service.getDescription());
                existingService.setPrice(service.getPrice());
                existingService.setDurationMinutes(service.getDurationMinutes());
                existingService.setIsActive(service.getIsActive());

                // 3. Lưu lại vào DB
                Service updatedService = serviceRepository.save(existingService);
                return new ResponseEntity<>(updatedService, HttpStatus.OK);

            }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // Trả về 404 nếu không tìm thấy ID

        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary="Xoá dịch vụ của cửa hàng")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteService(@PathVariable Long id) {
        try {
            // 1. Kiểm tra xem chi nhánh có tồn tại trong DB không
            if (!serviceRepository.existsById(id)) {
                return new ResponseEntity<>("Lỗi: Không tìm thấy dịch vụ có ID = " + id, HttpStatus.NOT_FOUND);
            }
            serviceRepository.deleteById(id);

            return new ResponseEntity<>("Đã xóa dịch vụ thành công!", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Không thể xóa dịch vụ này vì có dữ liệu liên quan (thợ, lịch hẹn...)",
                    HttpStatus.CONFLICT);
        }
    }

}
