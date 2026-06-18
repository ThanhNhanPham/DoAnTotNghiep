package com.example.smartgarage.service;

import com.example.smartgarage.dto.BranchNearbyResponse;
import com.example.smartgarage.entity.Branch;
import com.example.smartgarage.repository.BranchRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BranchServiceTest {

    @Test
    void getNearbyActiveBranches_sortsByTravelDistanceWhenRoutingDataExists() {
        Branch branchA = branch(1L, "A", 10.80, 106.70);
        Branch branchB = branch(2L, "B", 10.81, 106.71);
        BranchRepository branchRepository = branchRepository(List.of(branchA, branchB));
        StubRoutingService routingService = new StubRoutingService();
        BranchService branchService = new BranchService(branchRepository, routingService);

        routingService.routeInfoByBranchId.put(1L, new RouteInfo(12.5, 22.0));
        routingService.routeInfoByBranchId.put(2L, new RouteInfo(5.1, 9.0));

        List<BranchNearbyResponse> responses = branchService.getNearbyActiveBranches(10.75, 106.67);

        assertEquals(List.of(2L, 1L), responses.stream().map(BranchNearbyResponse::getId).toList());
        assertEquals(5.1, responses.get(0).getTravelDistanceKm());
        assertEquals(9.0, responses.get(0).getTravelDurationMinutes());
    }

    @Test
    void getNearbyActiveBranches_fallsBackToAirDistanceWhenRoutingUnavailable() {
        Branch branchA = branch(1L, "A", 10.90, 106.90);
        Branch branchB = branch(2L, "B", 10.76, 106.68);
        BranchRepository branchRepository = branchRepository(List.of(branchA, branchB));
        BranchService branchService = new BranchService(branchRepository, new StubRoutingService());

        List<BranchNearbyResponse> responses = branchService.getNearbyActiveBranches(10.75, 106.67);

        assertEquals(List.of(2L, 1L), responses.stream().map(BranchNearbyResponse::getId).toList());
        assertEquals(null, responses.get(0).getTravelDistanceKm());
    }

    private Branch branch(Long id, String name, double latitude, double longitude) {
        Branch branch = new Branch();
        branch.setId(id);
        branch.setName(name);
        branch.setAddress("Address " + name);
        branch.setPhone("0901234567");
        branch.setLatitude(latitude);
        branch.setLongitude(longitude);
        branch.setIsActive(true);
        return branch;
    }

    private BranchRepository branchRepository(List<Branch> branches) {
        return (BranchRepository) Proxy.newProxyInstance(
                BranchRepository.class.getClassLoader(),
                new Class[]{BranchRepository.class},
                (proxy, method, args) -> {
                    if ("findAllByIsActiveTrue".equals(method.getName())) {
                        return branches;
                    }
                    if ("toString".equals(method.getName())) {
                        return "BranchRepositoryStub";
                    }
                    throw new UnsupportedOperationException("Unsupported method: " + method.getName());
                }
        );
    }

    private static class StubRoutingService implements RoutingService {
        private final Map<Long, RouteInfo> routeInfoByBranchId = new HashMap<>();

        @Override
        public Map<Long, RouteInfo> getRouteInfo(double userLatitude, double userLongitude, List<Branch> branches) {
            return routeInfoByBranchId;
        }
    }
}
