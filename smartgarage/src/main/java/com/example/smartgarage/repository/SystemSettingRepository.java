package com.example.smartgarage.repository;

import com.example.smartgarage.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE system_settings
            SET version = version + 1,
                theme_color = :themeColor,
                dark_mode = :darkMode,
                font_size = :fontSize,
                language = :language,
                date_format = :dateFormat,
                time_zone = :timezone,
                email_notifications = :emailNotifications,
                push_notifications = :pushNotifications,
                sound_enabled = :soundEnabled,
                company_name = :companyName,
                company_phone = :companyPhone,
                company_email = :companyEmail,
                company_address = :companyAddress,
                updated_by = :updatedBy,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
            """, nativeQuery = true)
    int resetToDefaults(@Param("id") Long id,
                        @Param("themeColor") String themeColor,
                        @Param("darkMode") Boolean darkMode,
                        @Param("fontSize") Integer fontSize,
                        @Param("language") String language,
                        @Param("dateFormat") String dateFormat,
                        @Param("timezone") String timezone,
                        @Param("emailNotifications") Boolean emailNotifications,
                        @Param("pushNotifications") Boolean pushNotifications,
                        @Param("soundEnabled") Boolean soundEnabled,
                        @Param("companyName") String companyName,
                        @Param("companyPhone") String companyPhone,
                        @Param("companyEmail") String companyEmail,
                        @Param("companyAddress") String companyAddress,
                        @Param("updatedBy") String updatedBy);
}
