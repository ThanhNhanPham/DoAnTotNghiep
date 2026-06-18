package com.example.smartgarage.service;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class AdminScopeService {
    private final UserRepository userRepository;

    public AdminScopeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long resolveBranchScope(Authentication authentication, Long requestedBranchId) {
        User currentUser = getCurrentUser(authentication);

        if (currentUser.getRole() == Role.SUPERADMIN) {
            return requestedBranchId;
        }

        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Bạn không có quyền truy cập trang quản trị.");
        }

        if (currentUser.getBranch() == null || currentUser.getBranch().getId() == null) {
            throw new ForbiddenException("Tài khoản admin chưa được gán chi nhánh.");
        }

        Long assignedBranchId = currentUser.getBranch().getId();
        if (requestedBranchId != null && !Objects.equals(requestedBranchId, assignedBranchId)) {
            throw new ForbiddenException("Bạn chỉ được xem dữ liệu của chi nhánh được phân công.");
        }

        return assignedBranchId;
    }

    public void ensureBranchAccess(Authentication authentication, Long branchId) {
        resolveBranchScope(authentication, branchId);
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng đăng nhập."));
    }
}
