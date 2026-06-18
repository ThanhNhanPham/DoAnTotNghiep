package com.example.smartgarage.dto.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingOptionsResponse {
    private List<String> languages;
    private List<String> dateFormats;
    private List<String> timezones;
    private Integer minFontSize;
    private Integer maxFontSize;
}
