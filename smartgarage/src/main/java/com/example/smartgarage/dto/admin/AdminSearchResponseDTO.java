package com.example.smartgarage.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSearchResponseDTO {
    private List<AdminSearchResultDTO> customers;
    private List<AdminSearchResultDTO> bookings;
    private List<AdminSearchResultDTO> invoices;
}
