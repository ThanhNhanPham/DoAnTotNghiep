package com.example.smartgarage.dto.system;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SystemSettingRequest {
    @NotNull(message = "Phiên bản cấu hình không được để trống")
    @PositiveOrZero(message = "Phiên bản cấu hình không hợp lệ")
    private Long version;

    @NotBlank(message = "Màu chủ đạo không được để trống")
    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Màu chủ đạo phải theo định dạng hex, ví dụ #1890ff")
    private String themeColor;

    @NotNull(message = "Chế độ hiển thị không được để trống")
    private Boolean darkMode;

    @NotNull(message = "Kích thước chữ không được để trống")
    @Min(value = 12, message = "Kích thước chữ tối thiểu là 12")
    @Max(value = 18, message = "Kích thước chữ tối đa là 18")
    private Integer fontSize;

    @NotBlank(message = "Ngôn ngữ không được để trống")
    @Size(max = 10, message = "Ngôn ngữ không hợp lệ")
    private String language;

    @NotBlank(message = "Định dạng ngày tháng không được để trống")
    @Size(max = 30, message = "Định dạng ngày tháng không hợp lệ")
    private String dateFormat;

    @NotBlank(message = "Múi giờ không được để trống")
    @Size(max = 50, message = "Múi giờ không hợp lệ")
    private String timezone;

    @NotNull(message = "Thiết lập thông báo email không được để trống")
    private Boolean emailNotifications;

    @NotNull(message = "Thiết lập thông báo đẩy không được để trống")
    private Boolean pushNotifications;

    @NotNull(message = "Thiết lập âm thanh không được để trống")
    private Boolean soundEnabled;

    @NotBlank(message = "Tên doanh nghiệp không được để trống")
    @Size(max = 255, message = "Tên doanh nghiệp quá dài")
    private String companyName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9+()\\-\\s]{8,30}$", message = "Số điện thoại không đúng định dạng")
    private String companyPhone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 255, message = "Email quá dài")
    private String companyEmail;

    @Size(max = 2000, message = "Địa chỉ quá dài")
    private String companyAddress;
}
