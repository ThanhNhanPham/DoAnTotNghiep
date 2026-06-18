package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Vehicle;
import com.example.smartgarage.enums.VehicleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUserId(Long userId);

    @Query("""
            SELECT v FROM Vehicle v
            LEFT JOIN v.user u
            WHERE (:userId IS NULL OR u.id = :userId)
              AND (:type IS NULL OR v.type = :type)
              AND (:isActive IS NULL OR v.isActive = :isActive)
              AND (:brand IS NULL OR :brand = '' OR v.brand = :brand)
              AND (
                :keyword IS NULL OR :keyword = '' OR
                LOWER(COALESCE(v.licensePlate, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(v.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(v.model, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Page<Vehicle> searchVehicles(@Param("userId") Long userId,
                                 @Param("type") VehicleType type,
                                 @Param("isActive") Boolean isActive,
                                 @Param("brand") String brand,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);
}
