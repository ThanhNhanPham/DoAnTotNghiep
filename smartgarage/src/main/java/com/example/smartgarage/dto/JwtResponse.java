package com.example.smartgarage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtResponse {
    private String token;
//    private String type = "Bearer"; // Gán mặc định là Bearer
    private String email;
    private String role;
    private Long userId;
    private String fullAddress;
}
