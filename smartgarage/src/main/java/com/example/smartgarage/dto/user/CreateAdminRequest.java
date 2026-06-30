package com.example.smartgarage.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAdminRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$",
                message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone,

        @NotBlank(message = "Tỉnh/Thành phố không được để trống")
        @Size(max = 100, message = "Tên tỉnh không được quá 100 ký tự")
        String province,

        @NotBlank(message = "Phường/Xã không được để trống")
        @Size(max = 100, message = "Tên phường/xã không được quá 100 ký tự")
        String ward,

        @NotBlank(message = "Số nhà không được để trống")
        @Size(max = 100, message = "Số nhà không được quá 100 ký tự")
        String houseNumber,

        @NotNull(message = "Vui lòng chọn chi nhánh cho Admin")
        Long branchId
) {
}
