package com.example.smartgarage.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest (
    @NotBlank(message = "mật khẩu cũ không được để trống")
    String oldPassword,
    @NotBlank(message = "Mật khẩu mới không được để trống")
    String newPassword

)
{}
