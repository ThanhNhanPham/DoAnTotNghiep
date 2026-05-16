package com.example.smartgarage.controller;

import com.example.smartgarage.entity.Service;
import com.example.smartgarage.enums.VehicleType;
import com.example.smartgarage.service.ServiceService;
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

    private final ServiceService serviceService;

    public ServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
    }

    @Operation(summary="lấy danh sách tất cả các service của cửa hàng")
    @GetMapping
    public ResponseEntity<List<Service>> getAllServices(@RequestParam(required = false) VehicleType type) {
        List<Service> services = serviceService.getAllServices(type);
        return ResponseEntity.ok(services);
    }

    @Operation(summary="lấy thông tin chi tiết của một dịch vụ theo id")
    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable Long id) {
       Service result = serviceService.getServiceById(id);
       return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();
    }

    @Operation(summary="thêm dịch vụ mới cho cửa hàng")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Service> createService(@Valid @RequestBody Service service) {
        try {
            Service savedService = serviceService.createService(service);
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
            return serviceService.updateService(id, service)
                    .map(updatedService -> new ResponseEntity<>(updatedService, HttpStatus.OK))
                    .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            return new ResponseEntity<>((HttpHeaders) null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary="Xoá dịch vụ của cửa hàng")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteService(@PathVariable Long id) {
        try {
            if (!serviceService.deleteService(id)) {
                return new ResponseEntity<>("Lỗi: Không tìm thấy dịch vụ có ID = " + id, HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>("Đã xóa dịch vụ thành công!", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Không thể xóa dịch vụ này vì có dữ liệu liên quan (thợ, lịch hẹn...)",
                    HttpStatus.CONFLICT);
        }
    }

}
