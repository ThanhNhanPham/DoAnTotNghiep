package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Service;
import com.example.smartgarage.enums.VehicleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service,Long> {
    // 1. Tìm tất cả dịch vụ đang hoạt động để hiển thị lên App
    List<Service> findByIsActiveTrue();

    Page<Service> findByIsActiveTrue(Pageable pageable);

    List<Service> findByType(VehicleType type);

    Page<Service> findByType(VehicleType type, Pageable pageable);

    List<Service> findByIsActiveTrueAndType(VehicleType type);

    Page<Service> findByIsActiveTrueAndType(VehicleType type, Pageable pageable);

    @Query("""
            SELECT s FROM Service s
            WHERE (:type IS NULL OR s.type = :type)
              AND (:isActive IS NULL OR s.isActive = :isActive)
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Page<Service> searchServices(@Param("type") VehicleType type,
                                 @Param("isActive") Boolean isActive,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);

    // 2. Tìm kiếm dịch vụ theo tên (Phục vụ cho việc mapping từ lời khuyên của AI)
    Optional<Service> findByNameContainingIgnoreCase(String name);

    // 3. Lấy danh sách dịch vụ theo khoảng giá (Dành cho tính năng lọc trên App)
    List<Service> findByPriceBetween(Double minPrice, Double maxPrice);
}
