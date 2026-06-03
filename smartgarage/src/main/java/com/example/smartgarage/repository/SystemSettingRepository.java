package com.example.smartgarage.repository;

import com.example.smartgarage.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
}
