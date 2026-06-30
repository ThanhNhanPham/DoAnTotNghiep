package com.example.smartgarage.dto.user;

import com.example.smartgarage.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAccountStatusRequest(
        @NotNull(message = "Trạng thái tài khoản không được để trống")
        AccountStatus accountStatus
) {
}
