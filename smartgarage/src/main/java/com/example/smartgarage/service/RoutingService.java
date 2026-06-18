package com.example.smartgarage.service;

import com.example.smartgarage.entity.Branch;

import java.util.List;
import java.util.Map;

public interface RoutingService {
    Map<Long, RouteInfo> getRouteInfo(double userLatitude, double userLongitude, List<Branch> branches);
}
