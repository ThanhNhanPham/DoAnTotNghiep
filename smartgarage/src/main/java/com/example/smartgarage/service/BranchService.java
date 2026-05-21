package com.example.smartgarage.service;

import com.example.smartgarage.dto.BranchNearbyResponse;
import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BranchRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class BranchService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }
    public Branch  getBranchById(long id) {
        return branchRepository.findById(id).orElse(null);
    }
    public Branch createBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    public List<Branch> getActiveBranches() {
        return branchRepository.findAllByIsActiveTrue();
    }

    public List<BranchNearbyResponse> getNearbyActiveBranches(double userLatitude, double userLongitude) {
        return branchRepository.findAllByIsActiveTrue().stream()
                .filter(branch -> branch.getLatitude() != null && branch.getLongitude() != null)
                .map(branch -> BranchNearbyResponse.from(
                        branch,
                        calculateDistanceKm(userLatitude, userLongitude, branch.getLatitude(), branch.getLongitude())
                ))
                .sorted(Comparator.comparing(BranchNearbyResponse::getDistanceKm))
                .toList();
    }

    public Optional<Branch> updateBranch(Long id, Branch branchDetails) {
        return branchRepository.findById(id).map(existingBranch -> {
            existingBranch.setName(branchDetails.getName());
            existingBranch.setAddress(branchDetails.getAddress());
            existingBranch.setPhone(branchDetails.getPhone());
            existingBranch.setImageUrl(branchDetails.getImageUrl());
            existingBranch.setLatitude(branchDetails.getLatitude());
            existingBranch.setLongitude(branchDetails.getLongitude());
            existingBranch.setIsActive(branchDetails.getIsActive());
            return branchRepository.save(existingBranch);
        });
    }

    public void deactivateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh với ID: " + id));
        branch.setIsActive(false);
        branchRepository.save(branch);
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_KM * c * 100.0) / 100.0;
    }
}
