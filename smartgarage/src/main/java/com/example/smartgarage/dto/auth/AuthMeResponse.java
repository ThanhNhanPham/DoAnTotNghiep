package com.example.smartgarage.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthMeResponse {
    private Long userId;
    private String email;
    private String role;
    private String fullName;
    private String phone;
    private String fullAddress;
    private Boolean isActive;
}
