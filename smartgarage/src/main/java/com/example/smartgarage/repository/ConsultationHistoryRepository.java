package com.example.smartgarage.repository;

import com.example.smartgarage.entity.ConsultationHistory;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ConsultationHistoryRepository extends JpaRepository<ConsultationHistory, Long> {
    List<ConsultationHistory> findAllByOrderByCreatedAtDesc();

    List<ConsultationHistory> findByCustomerEmailOrderByCreatedAtDesc(String email);
    void deleteByCustomerEmail(String username );

    @Modifying
    @Query("delete from ConsultationHistory c where c.id = :id and c.customer.email = :email")
    int deleteByIdAndCustomerEmail(@Param("id") Long id, @Param("email") String email);
}
