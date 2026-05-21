package com.example.smartgarage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReviewSummaryResponse {
    private long totalReviews;
    private double averageRating;
}
