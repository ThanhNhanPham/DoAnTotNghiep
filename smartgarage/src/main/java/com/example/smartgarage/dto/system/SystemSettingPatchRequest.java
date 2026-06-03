package com.example.smartgarage.dto.system;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SystemSettingPatchRequest {
    @NotNull(message = "Phiên bản cấu hình không được để trống")
    @PositiveOrZero(message = "Phiên bản cấu hình không hợp lệ")
    private Long version;

    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Màu chủ đạo phải theo định dạng hex, ví dụ #1890ff")
    private String themeColor;

    private Boolean darkMode;

    @Min(value = 12, message = "Kích thước chữ tối thiểu là 12")
    @Max(value = 18, message = "Kích thước chữ tối đa là 18")
    private Integer fontSize;

    @Size(max = 10, message = "Ngôn ngữ không hợp lệ")
    private String language;

    @Size(max = 30, message = "Định dạng ngày tháng không hợp lệ")
    private String dateFormat;

    @Size(max = 50, message = "Múi giờ không hợp lệ")
    private String timezone;

    private Boolean emailNotifications;

    private Boolean pushNotifications;

    private Boolean soundEnabled;

    @Size(max = 255, message = "Tên doanh nghiệp quá dài")
    private String companyName;

    @Pattern(regexp = "^[0-9+()\\-\\s]{8,30}$", message = "Số điện thoại không đúng định dạng")
    private String companyPhone;

    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email quá dài")
    private String companyEmail;

    @Size(max = 2000, message = "Địa chỉ quá dài")
    private String companyAddress;
}
