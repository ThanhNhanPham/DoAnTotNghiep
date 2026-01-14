package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Mechanic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MechanicRepository extends JpaRepository<Mechanic,Long> {
    // Tìm tất cả thợ thuộc một chi nhánh cụ thể
    List<Mechanic> findByBranchId(Long branchId);
    // Tìm thợ theo trạng thái (ví dụ: tìm những thợ đang rảnh - ACTIVE)
    List<Mechanic> findByStatus(String status);
    // Kết hợp: Tìm thợ đang rảnh tại một chi nhánh cụ thể
    List<Mechanic> findByBranchIdAndStatus(Long branchId, String status);
}
