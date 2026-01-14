package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service,Long> {
    // 1. Tìm tất cả dịch vụ đang hoạt động để hiển thị lên App
    List<Service> findByIsActiveTrue();

    // 2. Tìm kiếm dịch vụ theo tên (Phục vụ cho việc mapping từ lời khuyên của AI)
    Optional<Service> findByNameContainingIgnoreCase(String name);

    // 3. Lấy danh sách dịch vụ theo khoảng giá (Dành cho tính năng lọc trên App)
    List<Service> findByPriceBetween(Double minPrice, Double maxPrice);
}
