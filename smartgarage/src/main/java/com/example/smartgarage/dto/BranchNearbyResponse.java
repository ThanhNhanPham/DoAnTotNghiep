package com.example.smartgarage.dto;

import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.service.RouteInfo;
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
    private Double travelDistanceKm;
    private Double travelDurationMinutes;
    private String matchedAddress;
    private Double userLatitude;
    private Double userLongitude;

    public static BranchNearbyResponse from(
            Branch branch,
            double distanceKm,
            RouteInfo routeInfo,
            double userLatitude,
            double userLongitude
    ) {
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
                .travelDistanceKm(routeInfo != null ? routeInfo.travelDistanceKm() : null)
                .travelDurationMinutes(routeInfo != null ? routeInfo.travelDurationMinutes() : null)
                .userLatitude(userLatitude)
                .userLongitude(userLongitude)
                .build();
    }
}
