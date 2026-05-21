package com.example.smartgarage.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest (
    @NotBlank(message = "mật khẩu cũ không được để trống")
    String oldPassword,
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự")
    String newPassword,
    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    String confirmNewPassword

)
{}
