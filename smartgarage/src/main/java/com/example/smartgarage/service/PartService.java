package com.example.smartgarage.service;

import com.example.smartgarage.entity.Part;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ResourceNotFoundException;
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
    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
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

    public Part findById(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện ID: " + id));
    }

    public List<Part> findByNameContainingIgnoreCase(String name) {
        return partRepository.findByNameContainingIgnoreCase(name);
    }

    public Part save(Part part) {
        return partRepository.save(part);
    }

    public Part updatePart(Long id, Part partDetails) {
        Part part = findById(id);
        part.setName(partDetails.getName());
        part.setPrice(partDetails.getPrice());
        part.setDescription(partDetails.getDescription());
        part.setUnit(partDetails.getUnit());
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

    public List<Part> findLowStockParts(int threshold) {
        return partRepository.findLowStockParts(threshold);
    }
}
