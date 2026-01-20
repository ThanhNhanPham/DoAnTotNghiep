package com.example.smartgarage.service;

import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.repository.MechanicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class MechanicService {
    @Autowired
    private MechanicRepository mechanicRepository;

    // Lấy danh sách thợ đang rảnh tại một chi nhánh cụ thể
    public List<Mechanic> getAvailableByBranch(Long branchId) {
        // "ACTIVE" là trạng thái thợ đang sẵn sàng nhận việc
        return mechanicRepository.findByBranchIdAndStatus(branchId, "ACTIVE");
    }
    // Tìm thợ theo ID (Dùng để kiểm tra khi gán thợ vào lịch hẹn)
    public Mechanic getById(Long id) {
        return mechanicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thợ sửa xe với ID: " + id));
    }
    // Lấy tất cả thợ sửa xe (Dùng cho Admin quản lý danh sách nhân sự)
    public List<Mechanic> getAllMechanics() {
        return mechanicRepository.findAll();
    }
    // Cập nhật trạng thái thợ (ACTIVE <-> BUSY)
    public void updateMechanicStatus(Long id, MechanicStatus status) {
        Mechanic mechanic = getById(id);
        mechanic.setStatus(status);
        mechanicRepository.save(mechanic);
    }
}
