package com.example.smartgarage.service;

import com.example.smartgarage.entity.ConsultationHistory;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.ConsultationHistoryRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConsultationHistoryService {
    private final ConsultationHistoryRepository consultationHistoryRepository;
    public ConsultationHistoryService(ConsultationHistoryRepository consultationHistoryRepository) {
        this.consultationHistoryRepository = consultationHistoryRepository;
    }
    public List<ConsultationHistory> findAllByOrderByCreatedAtDesc() {
        return consultationHistoryRepository.findAllByOrderByCreatedAtDesc();
    }
    public List<ConsultationHistory> findByCustomerEmailOrderByCreatedAtDesc(String email){
        return consultationHistoryRepository.findByCustomerEmailOrderByCreatedAtDesc(email);
    }
    @Transactional
    public void deleteByCustomerEmail(String email){
        consultationHistoryRepository.deleteByCustomerEmail(email);
    }

    @Transactional
    public void deleteMyHistoryById(Long id, String email) {
        int deletedRows = consultationHistoryRepository.deleteByIdAndCustomerEmail(id, email);
        if (deletedRows == 0) {
            throw new ResourceNotFoundException("Không tìm thấy lịch sử truy vấn thuộc tài khoản của bạn.");
        }
    }

}
