package com.example.smartgarage.service;

import com.example.smartgarage.entity.Branch;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenRouteServiceRoutingService implements RoutingService {
    private static final Logger logger = LoggerFactory.getLogger(OpenRouteServiceRoutingService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ors.base-url:https://api.openrouteservice.org}")
    private String baseUrl;

    @Value("${ors.api-key:}")
    private String apiKey;

    @Value("${ors.profile:driving-car}")
    private String profile;

    @Value("${ors.enabled:true}")
    private boolean enabled;

    public OpenRouteServiceRoutingService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Map<Long, RouteInfo> getRouteInfo(double userLatitude, double userLongitude, List<Branch> branches) {
        if (branches == null || branches.isEmpty()) {
            return Collections.emptyMap();
        }
        if (!enabled) {
            logger.info("Bỏ qua OpenRouteService vì ors.enabled=false");
            return Collections.emptyMap();
        }
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Bỏ qua OpenRouteService vì ORS_API_KEY chưa được nạp vào backend");
            return Collections.emptyMap();
        }

        try {
            String url = buildMatrixUrl();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", apiKey);

            List<List<Double>> locations = new ArrayList<>();
            locations.add(List.of(userLongitude, userLatitude));

            for (Branch branch : branches) {
                locations.add(List.of(branch.getLongitude(), branch.getLatitude()));
            }

            List<String> destinations = new ArrayList<>();
            for (int i = 1; i <= branches.size(); i++) {
                destinations.add(String.valueOf(i));
            }

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("locations", locations);
            payload.put("sources", List.of("0"));
            payload.put("destinations", destinations);
            payload.put("metrics", List.of("distance", "duration"));
            payload.put("units", "km");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            JsonNode responseBody = response.getBody() == null || response.getBody().isBlank()
                    ? null
                    : objectMapper.readTree(response.getBody());

            return parseMatrixResponse(responseBody, branches);
        } catch (HttpStatusCodeException ex) {
            logger.warn(
                    "OpenRouteService trả về lỗi {} với nội dung: {}",
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString()
            );
            return Collections.emptyMap();
        } catch (Exception ex) {
            logger.warn("Không lấy được dữ liệu tuyến đường từ OpenRouteService: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }

    private String buildMatrixUrl() {
        String normalizedBaseUrl = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        return normalizedBaseUrl + "/v2/matrix/" + profile;
    }

    private Map<Long, RouteInfo> parseMatrixResponse(JsonNode body, List<Branch> branches) {
        if (body == null) {
            return Collections.emptyMap();
        }

        JsonNode distances = body.path("distances");
        JsonNode durations = body.path("durations");
        if (!distances.isArray() || distances.isEmpty()) {
            return Collections.emptyMap();
        }

        JsonNode distanceRow = distances.get(0);
        JsonNode durationRow = durations.isArray() && !durations.isEmpty() ? durations.get(0) : null;
        Map<Long, RouteInfo> routeInfoByBranchId = new LinkedHashMap<>();

        for (int i = 0; i < branches.size(); i++) {
            Branch branch = branches.get(i);
            JsonNode distanceNode = distanceRow.path(i);
            JsonNode durationNode = durationRow != null ? durationRow.path(i) : null;

            Double travelDistanceKm = distanceNode.isNumber()
                    ? round(distanceNode.doubleValue())
                    : null;
            Double travelDurationMinutes = durationNode != null && durationNode.isNumber()
                    ? round(durationNode.doubleValue() / 60.0)
                    : null;

            routeInfoByBranchId.put(branch.getId(), new RouteInfo(travelDistanceKm, travelDurationMinutes));
        }

        return routeInfoByBranchId;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
