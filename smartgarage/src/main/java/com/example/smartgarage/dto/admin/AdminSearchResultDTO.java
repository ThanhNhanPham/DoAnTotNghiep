package com.example.smartgarage.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSearchResultDTO {
    private String type;
    private Long id;
    private String title;
    private String subtitle;
    private String route;
}
