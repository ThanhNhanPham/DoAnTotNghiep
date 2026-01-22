package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartRepository extends JpaRepository<Part,Long> {
    // 1. Tìm kiếm linh kiện theo tên (hỗ trợ tính năng tìm kiếm ở giao diện)
    List<Part> findByNameContainingIgnoreCase(String name);

    // 2. Thống kê các linh kiện sắp hết hàng (số lượng thấp hơn mức quy định)
    // Giúp Admin biết để nhập thêm hàng
    @Query("SELECT p FROM Part p WHERE p.quantity < :threshold")
    List<Part> findLowStockParts(int threshold);

    // 3. Lấy danh sách linh kiện còn hàng (để hiển thị khi chọn cho đơn hàng)
    List<Part> findByQuantityGreaterThan(int quantity);
    // 4. Kiểm tra tồn tại theo tên (Hữu ích khi thêm mới để tránh trùng lặp)
    boolean existsByNameIgnoreCase(String name);
}
