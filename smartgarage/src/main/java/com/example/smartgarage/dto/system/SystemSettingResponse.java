package com.example.smartgarage.dto.system;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingResponse {
    private Long id;
    private Long version;
    private String themeColor;
    private Boolean darkMode;
    private Integer fontSize;
    private String language;
    private String dateFormat;
    private String timezone;
    private Boolean emailNotifications;
    private Boolean pushNotifications;
    private Boolean soundEnabled;
    private String companyName;
    private String companyPhone;
    private String companyEmail;
    private String companyAddress;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
