package com.example.smartgarage.service;

import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.entity.Mechanic;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BranchRepository;
import com.example.smartgarage.repository.MechanicRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class MechanicService {
    private final MechanicRepository mechanicRepository;
    private final BranchRepository branchRepository;

    public MechanicService(MechanicRepository mechanicRepository, BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
        this.mechanicRepository = mechanicRepository;
    }

    // Lấy danh sách thợ đang rảnh tại một chi nhánh cụ thể
    public List<Mechanic> getAvailableByBranch(Long branchId) {
        // "ACTIVE" là trạng thái thợ đang sẵn sàng nhận việc
        return mechanicRepository.findByBranchIdAndStatus(branchId, MechanicStatus.ACTIVE);
    }
    // Tìm thợ theo ID (Dùng để kiểm tra khi gán thợ vào lịch hẹn)
    public Mechanic getById(Long id) {
        return mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ sửa xe với ID: " + id));
    }
    // Lấy danh sách tất cả thợ (Dùng cho Admin để quản lý)
    public List<Mechanic> getAllMechanics() {
        return mechanicRepository.findAll();
    }
    // Lấy danh sách thợ theo chi nhánh (Dùng cho Admin để quản lý)
    public List<Mechanic> findByBranchId(Long branchId) {
        return mechanicRepository.findByBranchId(branchId);
    }

    public Mechanic findById(Long id) {
        return mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ sửa xe với ID: " + id));
    }

    public Mechanic save(Mechanic mechanic) {
        return mechanicRepository.save(mechanic);
    }

    public Mechanic createMechanic(Long branchId, Mechanic mechanic) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh với ID: " + branchId));
        mechanic.setBranch(branch);
        return mechanicRepository.save(mechanic);
    }

    // Cập nhật trạng thái thợ (ACTIVE <-> BUSY)
    public Mechanic updateMechanicStatus(Long id, MechanicStatus status) {
        Mechanic mechanic = getById(id);
        mechanic.setStatus(status);
        return mechanicRepository.save(mechanic);
    }

    public void softDeleteMechanic(Long id) {
        Mechanic mechanic = getById(id);
        mechanic.setStatus(MechanicStatus.INACTIVE);
        mechanicRepository.save(mechanic);
    }

    // sửa thông tin của thợ
    public Mechanic updateMechanic(Long id, Mechanic updatedData) {
        Mechanic existingMechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ sửa xe với ID: " + id));

        // 2. Lấy đối tượng Branch đầy đủ từ DB thông qua ID gửi lên
        if (updatedData.getBranch() != null) {
            Branch fullBranch = branchRepository.findById(updatedData.getBranch().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh với ID: " + updatedData.getBranch().getId()));
            existingMechanic.setBranch(fullBranch); // Gán đối tượng "đầy đủ"
        }
        // 3. Cập nhật các trường thông tin khác
        existingMechanic.setFullName(updatedData.getFullName());
        existingMechanic.setPhone(updatedData.getPhone());
        existingMechanic.setAddress(updatedData.getAddress());
        existingMechanic.setSpecialization(updatedData.getSpecialization());
        existingMechanic.setStatus(updatedData.getStatus());
        return mechanicRepository.save(existingMechanic);
    }
}
