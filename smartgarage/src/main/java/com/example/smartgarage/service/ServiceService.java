package com.example.smartgarage.service;

import com.example.smartgarage.entity.Service;
import com.example.smartgarage.enums.VehicleType;
import com.example.smartgarage.repository.ServiceRepository;

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
