package com.example.smartgarage.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    public Long bookingId;
    public int rating;
    public String comment;
}
