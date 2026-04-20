package com.example.smartgarage.repository;

import com.example.smartgarage.entity.ConsultationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ConsultationHistoryRepository extends JpaRepository<ConsultationHistory, Long> {
    List<ConsultationHistory> findAllByOrderByCreatedAtDesc();

    List<ConsultationHistory> findByCustomerEmailOrderByCreatedAtDesc(String email);
}
