package com.example.smartgarage.dto.booking;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReplaceBookingServicesRequest {
    @NotEmpty(message = "serviceIds không được để trống")
    private List<@NotNull(message = "serviceId không được để trống") Long> serviceIds;
}
