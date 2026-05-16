package com.example.smartgarage.service;

import com.example.smartgarage.entity.Part;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.PartRepository;
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
