package com.example.smartgarage.service;

import com.example.smartgarage.entity.Service;
import com.example.smartgarage.enums.VehicleType;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.repository.ServiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class ServiceService {
    private final ServiceRepository serviceRepository;

    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public List<Service> getAllServices(VehicleType type) {
        if (type != null) {
            return serviceRepository.findByType(type);
        }
        return serviceRepository.findAll();
    }

    public Page<Service> getServices(VehicleType type, Boolean isActive, String keyword, int page, int size) {
        if (page < 0) {
            throw new BadRequestException("page phải lớn hơn hoặc bằng 0");
        }
        if (size <= 0) {
            throw new BadRequestException("size phải lớn hơn 0");
        }
        int safeSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.ASC, "name"));
        return serviceRepository.searchServices(type, isActive, keyword == null ? null : keyword.trim(), pageable);
    }

    public Service getServiceById(Long id) {
        return serviceRepository.findById(id).orElse(null);
    }

    public Service createService(Service service) {
        return serviceRepository.save(service);
    }

    public Optional<Service> updateService(Long id, Service serviceDetails) {
        return serviceRepository.findById(id).map(existingService -> {
            existingService.setName(serviceDetails.getName());
            existingService.setDescription(serviceDetails.getDescription());
            existingService.setPrice(serviceDetails.getPrice());
            existingService.setDurationMinutes(serviceDetails.getDurationMinutes());
            existingService.setImageUrl(serviceDetails.getImageUrl());
            existingService.setType(serviceDetails.getType());
            existingService.setIsActive(serviceDetails.getIsActive());
            return serviceRepository.save(existingService);
        });
    }

    public boolean deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            return false;
        }
        serviceRepository.deleteById(id);
        return true;
    }
}
