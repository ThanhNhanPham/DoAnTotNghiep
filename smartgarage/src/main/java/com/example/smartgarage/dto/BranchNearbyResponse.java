package com.example.smartgarage.dto;

import com.example.smartgarage.entity.Branch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchNearbyResponse {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private String imageUrl;
    private Boolean isActive;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;

    public static BranchNearbyResponse from(Branch branch, double distanceKm) {
        return BranchNearbyResponse.builder()
                .id(branch.getId())
                .name(branch.getName())
                .address(branch.getAddress())
                .phone(branch.getPhone())
                .imageUrl(branch.getImageUrl())
                .isActive(branch.getIsActive())
                .latitude(branch.getLatitude())
                .longitude(branch.getLongitude())
                .distanceKm(distanceKm)
                .build();
    }
}
