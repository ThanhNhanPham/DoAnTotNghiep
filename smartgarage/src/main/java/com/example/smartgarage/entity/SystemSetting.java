package com.example.smartgarage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting {
    @Id
    private Long id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "theme_color", nullable = false, length = 20)
    private String themeColor;

    @Column(name = "dark_mode", nullable = false)
    private Boolean darkMode;

    @Column(name = "font_size", nullable = false)
    private Integer fontSize;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @Column(name = "date_format", nullable = false, length = 30)
    private String dateFormat;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timezone;

    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications;

    @Column(name = "push_notifications", nullable = false)
    private Boolean pushNotifications;

    @Column(name = "sound_enabled", nullable = false)
    private Boolean soundEnabled;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "company_phone", nullable = false, length = 30)
    private String companyPhone;

    @Column(name = "company_email", nullable = false, length = 255)
    private String companyEmail;

    @Column(name = "company_address", columnDefinition = "TEXT")
    private String companyAddress;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
    }
}
