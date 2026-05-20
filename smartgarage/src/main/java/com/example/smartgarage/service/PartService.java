package com.example.smartgarage.service;

import com.example.smartgarage.dto.part.PartRequest;
import com.example.smartgarage.dto.part.PartResponse;
import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.entity.Part;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ConflictException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BranchRepository;
import com.example.smartgarage.repository.BookedPartRepository;
import com.example.smartgarage.repository.PartRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartService {
    private final PartRepository partRepository;
    private final BranchRepository branchRepository;
    private final BookedPartRepository bookedPartRepository;

    public PartService(PartRepository partRepository,
                       BranchRepository branchRepository,
                       BookedPartRepository bookedPartRepository) {
        this.partRepository = partRepository;
        this.branchRepository = branchRepository;
        this.bookedPartRepository = bookedPartRepository;
    }
    public List<Part> findAll() {
        return partRepository.findAll();
    }

    public Page<Part> findAll(String keyword, String stockStatus, int page, int size) {
        if (page < 0) {
            throw new BadRequestException("page phải lớn hơn hoặc bằng 0");
        }
        if (size <= 0) {
            throw new BadRequestException("size phải lớn hơn 0");
        }
        if (stockStatus != null && !stockStatus.isBlank()
                && !"in-stock".equals(stockStatus)
                && !"out-of-stock".equals(stockStatus)) {
            throw new BadRequestException("Trạng thái kho không hợp lệ.");
        }

        int safeSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.ASC, "name"));
        return partRepository.searchParts(keyword == null ? null : keyword.trim(), stockStatus, pageable);
    }
    public Part addPartToBranch(Long branchId, PartRequest request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh với ID: " + branchId));
        String normalizedName = normalizePartName(request.name());
        if (partRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ConflictException("Tên linh kiện đã tồn tại trong hệ thống.");
        }

        Part part = Part.builder()
                .name(normalizedName)
                .description(normalizeOptionalText(request.description()))
                .price(request.price())
                .quantity(request.quantity())
                .unit(request.unit().trim())
                .branch(branch)
                .build();
        return partRepository.save(part);
    }

    public Part findById(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện ID: " + id));
    }

    public PartResponse findResponseById(Long id) {
        return mapToResponse(findById(id));
    }

    public List<Part> findByNameContainingIgnoreCase(String name) {
        return partRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Part> findByBranchId(Long branchId) {
        if (!branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Không tìm thấy chi nhánh với ID: " + branchId);
        }
        return partRepository.findByBranchId(branchId);
    }

    public Part updatePart(Long id, PartRequest request) {
        Part part = findById(id);
        String normalizedName = normalizePartName(request.name());
        if (partRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ConflictException("Tên linh kiện đã tồn tại trong hệ thống.");
        }

        part.setName(normalizedName);
        part.setPrice(request.price());
        part.setDescription(normalizeOptionalText(request.description()));
        part.setUnit(request.unit().trim());
        part.setQuantity(request.quantity());
        return partRepository.save(part);
    }

    public Part addStock(Long id, Integer amount) {
        if (amount == null || amount <= 0) {
            throw new BadRequestException("Số lượng nhập phải lớn hơn 0");
        }

        Part part = findById(id);
        part.setQuantity(part.getQuantity() + amount);
        return partRepository.save(part);
    }

    public Part removeStock(Long id, Integer amount) {
        if (amount == null || amount <= 0) {
            throw new BadRequestException("Số lượng xuất phải lớn hơn 0");
        }

        Part part = findById(id);
        if (part.getQuantity() < amount) {
            throw new BadRequestException("Số lượng tồn kho không đủ để xuất");
        }

        part.setQuantity(part.getQuantity() - amount);
        return partRepository.save(part);
    }

    public void deletePart(Long id) {
        Part part = findById(id);
        if (bookedPartRepository.existsByPartId(id)) {
            throw new ConflictException("Không thể xóa linh kiện đã được sử dụng trong booking.");
        }
        partRepository.delete(part);
    }

    public List<Part> findLowStockParts(int threshold) {
        return partRepository.findLowStockParts(threshold);
    }

    private String normalizePartName(String name) {
        String normalized = name == null ? null : name.trim();
        if (normalized == null || normalized.isBlank()) {
            throw new BadRequestException("Tên linh kiện không được để trống");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private PartResponse mapToResponse(Part part) {
        Branch branch = part.getBranch();
        return new PartResponse(
                part.getId(),
                part.getName(),
                part.getDescription(),
                part.getPrice(),
                part.getQuantity(),
                part.getUnit(),
                branch != null ? branch.getId() : null,
                branch != null ? branch.getName() : null
        );
    }
}
