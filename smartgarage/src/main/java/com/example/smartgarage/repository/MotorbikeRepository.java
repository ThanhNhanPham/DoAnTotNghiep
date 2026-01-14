package com.example.smartgarage.repository;

import com.example.smartgarage.entity.Motorbike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MotorbikeRepository extends JpaRepository<Motorbike,Long> {
    List<Motorbike> findByUserId(Long userId);
//    List<Motorbike> findAllByUserId(Long userId);
}
