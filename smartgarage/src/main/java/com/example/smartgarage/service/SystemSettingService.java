package com.example.smartgarage.service;

import com.example.smartgarage.dto.system.SystemSettingOptionsResponse;
import com.example.smartgarage.dto.system.SystemSettingPatchRequest;
import com.example.smartgarage.dto.system.SystemSettingRequest;
import com.example.smartgarage.dto.system.SystemSettingResponse;
import com.example.smartgarage.entity.SystemSetting;
import com.example.smartgarage.exception.ConflictException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class SystemSettingService {
    private static final long DEFAULT_SETTINGS_ID = 1L;
    private static final int MIN_FONT_SIZE = 12;
    private static final int MAX_FONT_SIZE = 18;
    private static final List<String> SUPPORTED_LANGUAGES = List.of("vi", "en");
    private static final List<String> SUPPORTED_DATE_FORMATS = List.of("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD");
    private static final List<String> SUPPORTED_TIMEZONES = List.of("Asia/Ho_Chi_Minh", "UTC", "Asia/Bangkok");
    private static final Set<String> SUPPORTED_LANGUAGE_SET = Set.copyOf(SUPPORTED_LANGUAGES);
    private static final Set<String> SUPPORTED_DATE_FORMAT_SET = Set.copyOf(SUPPORTED_DATE_FORMATS);
    private static final Set<String> SUPPORTED_TIMEZONE_SET = Set.copyOf(SUPPORTED_TIMEZONES);
    private static final String SYSTEM_ACTOR = "system";

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    @PostConstruct
    @Transactional
    public void initializeDefaultSettings() {
        if (systemSettingRepository.existsById(DEFAULT_SETTINGS_ID)) {
            return;
        }
        systemSettingRepository.save(buildDefaultSettings(SYSTEM_ACTOR));
    }

    @Transactional(readOnly = true)
    public SystemSettingResponse getSystemSettings() {
        return mapToResponse(getRequiredSettings());
    }

    @Transactional(readOnly = true)
    public SystemSettingOptionsResponse getSystemSettingOptions() {
        return SystemSettingOptionsResponse.builder()
                .languages(SUPPORTED_LANGUAGES)
                .dateFormats(SUPPORTED_DATE_FORMATS)
                .timezones(SUPPORTED_TIMEZONES)
                .minFontSize(MIN_FONT_SIZE)
                .maxFontSize(MAX_FONT_SIZE)
                .build();
    }

    @Transactional
    public SystemSettingResponse updateSystemSettings(SystemSettingRequest request, Authentication authentication) {
        validateSupportedValues(request.getLanguage(), request.getDateFormat(), request.getTimezone());

        SystemSetting settings = getRequiredSettings();
        assertVersionMatches(settings, request.getVersion());

        settings.setThemeColor(request.getThemeColor());
        settings.setDarkMode(request.getDarkMode());
        settings.setFontSize(request.getFontSize());
        settings.setLanguage(request.getLanguage());
        settings.setDateFormat(request.getDateFormat());
        settings.setTimezone(request.getTimezone());
        settings.setEmailNotifications(request.getEmailNotifications());
        settings.setPushNotifications(request.getPushNotifications());
        settings.setSoundEnabled(request.getSoundEnabled());
        settings.setCompanyName(request.getCompanyName());
        settings.setCompanyPhone(request.getCompanyPhone());
        settings.setCompanyEmail(request.getCompanyEmail());
        settings.setCompanyAddress(request.getCompanyAddress());
        settings.setUpdatedBy(resolveActor(authentication));

        return mapToResponse(systemSettingRepository.save(settings));
    }

    @Transactional
    public SystemSettingResponse patchSystemSettings(SystemSettingPatchRequest request, Authentication authentication) {
        SystemSetting settings = getRequiredSettings();
        assertVersionMatches(settings, request.getVersion());

        String language = request.getLanguage() != null ? request.getLanguage() : settings.getLanguage();
        String dateFormat = request.getDateFormat() != null ? request.getDateFormat() : settings.getDateFormat();
        String timezone = request.getTimezone() != null ? request.getTimezone() : settings.getTimezone();
        validateSupportedValues(language, dateFormat, timezone);

        if (request.getThemeColor() != null) {
            settings.setThemeColor(request.getThemeColor());
        }
        if (request.getDarkMode() != null) {
            settings.setDarkMode(request.getDarkMode());
        }
        if (request.getFontSize() != null) {
            settings.setFontSize(request.getFontSize());
        }
        if (request.getLanguage() != null) {
            settings.setLanguage(request.getLanguage());
        }
        if (request.getDateFormat() != null) {
            settings.setDateFormat(request.getDateFormat());
        }
        if (request.getTimezone() != null) {
            settings.setTimezone(request.getTimezone());
        }
        if (request.getEmailNotifications() != null) {
            settings.setEmailNotifications(request.getEmailNotifications());
        }
        if (request.getPushNotifications() != null) {
            settings.setPushNotifications(request.getPushNotifications());
        }
        if (request.getSoundEnabled() != null) {
            settings.setSoundEnabled(request.getSoundEnabled());
        }
        if (request.getCompanyName() != null) {
            settings.setCompanyName(request.getCompanyName());
        }
        if (request.getCompanyPhone() != null) {
            settings.setCompanyPhone(request.getCompanyPhone());
        }
        if (request.getCompanyEmail() != null) {
            settings.setCompanyEmail(request.getCompanyEmail());
        }
        if (request.getCompanyAddress() != null) {
            settings.setCompanyAddress(request.getCompanyAddress());
        }
        settings.setUpdatedBy(resolveActor(authentication));

        return mapToResponse(systemSettingRepository.save(settings));
    }

    @Transactional
    public SystemSettingResponse resetSystemSettings(Authentication authentication) {
        int updatedRows = systemSettingRepository.resetToDefaults(
                DEFAULT_SETTINGS_ID,
                "#1890ff",
                false,
                14,
                "vi",
                "DD/MM/YYYY",
                "Asia/Ho_Chi_Minh",
                true,
                true,
                false,
                "Smart Garage",
                "0901234567",
                "6351071051@st.utc2.edu.vn",
                "25 đường số 18, Hiệp Bình, TPHCM",
                resolveActor(authentication)
        );
        if (updatedRows == 0) {
            throw new ResourceNotFoundException("Không tìm thấy cấu hình hệ thống");
        }
        return mapToResponse(getRequiredSettings());
    }

    private SystemSetting getRequiredSettings() {
        return systemSettingRepository.findById(DEFAULT_SETTINGS_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình hệ thống"));
    }

    private void assertVersionMatches(SystemSetting settings, Long requestVersion) {
        if (!settings.getVersion().equals(requestVersion)) {
            throw new ConflictException("Cấu hình hệ thống đã được cập nhật bởi người khác. Vui lòng tải lại dữ liệu trước khi lưu.");
        }
    }

    private void validateSupportedValues(String language, String dateFormat, String timezone) {
        if (!SUPPORTED_LANGUAGE_SET.contains(language)) {
            throw new IllegalArgumentException("Ngôn ngữ không được hỗ trợ. Các giá trị hợp lệ: " + SUPPORTED_LANGUAGES);
        }
        if (!SUPPORTED_DATE_FORMAT_SET.contains(dateFormat)) {
            throw new IllegalArgumentException("Định dạng ngày tháng không được hỗ trợ. Các giá trị hợp lệ: " + SUPPORTED_DATE_FORMATS);
        }
        if (!SUPPORTED_TIMEZONE_SET.contains(timezone)) {
            throw new IllegalArgumentException("Múi giờ không được hỗ trợ. Các giá trị hợp lệ: " + SUPPORTED_TIMEZONES);
        }
    }

    private SystemSetting buildDefaultSettings(String updatedBy) {
        SystemSetting settings = new SystemSetting();
        settings.setId(DEFAULT_SETTINGS_ID);
        settings.setVersion(0L);
        applyDefaultValues(settings);
        settings.setUpdatedBy(updatedBy);
        return settings;
    }

    private void applyDefaultValues(SystemSetting settings) {
        settings.setThemeColor("#1890ff");
        settings.setDarkMode(false);
        settings.setFontSize(14);
        settings.setLanguage("vi");
        settings.setDateFormat("DD/MM/YYYY");
        settings.setTimezone("Asia/Ho_Chi_Minh");
        settings.setEmailNotifications(true);
        settings.setPushNotifications(true);
        settings.setSoundEnabled(false);
        settings.setCompanyName("Smart Garage");
        settings.setCompanyPhone("0901234567");
        settings.setCompanyEmail("6351071051@st.utc2.edu.vn");
        settings.setCompanyAddress("25 đường số 18, Hiệp Bình, TPHCM");
    }

    private String resolveActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return SYSTEM_ACTOR;
        }
        return authentication.getName();
    }

    private SystemSettingResponse mapToResponse(SystemSetting settings) {
        return SystemSettingResponse.builder()
                .id(settings.getId())
                .version(settings.getVersion())
                .themeColor(settings.getThemeColor())
                .darkMode(settings.getDarkMode())
                .fontSize(settings.getFontSize())
                .language(settings.getLanguage())
                .dateFormat(settings.getDateFormat())
                .timezone(settings.getTimezone())
                .emailNotifications(settings.getEmailNotifications())
                .pushNotifications(settings.getPushNotifications())
                .soundEnabled(settings.getSoundEnabled())
                .companyName(settings.getCompanyName())
                .companyPhone(settings.getCompanyPhone())
                .companyEmail(settings.getCompanyEmail())
                .companyAddress(settings.getCompanyAddress())
                .updatedBy(settings.getUpdatedBy())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}
