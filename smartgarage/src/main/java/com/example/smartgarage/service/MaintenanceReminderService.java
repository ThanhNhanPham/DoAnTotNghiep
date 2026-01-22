package com.example.smartgarage.service;

import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MaintenanceReminderService {
    @Autowired private BookingRepository bookingRepository;
    @Autowired private EmailService emailService;
    @Autowired private EmailTemplateService templateService;
    @Scheduled(cron = "0 * * * * ?")// mõi phút quét một lần để test
    public void sendDailyMaintenanceReminders() {
        // Tính toán khoảng thời gian 6 tháng trước
        LocalDateTime sáuThángTrước_BắtĐầu = LocalDateTime.now().minusMonths(6).withHour(0).withMinute(0);
        LocalDateTime sáuThángTrước_KếtThúc = sáuThángTrước_BắtĐầu.plusDays(1);

        List<Booking> listReminders = bookingRepository.findBookingsForReminder(sáuThángTrước_BắtĐầu, sáuThángTrước_KếtThúc);

        for (Booking booking : listReminders) {
            String htmlContent = templateService.buildMaintenanceReminderEmail(
                    booking.getUser().getFullName(),
                    booking.getMotorbike().getModel() // Giả sử bạn có field này trong Booking
            );

            emailService.sendHtmlEmail(
                    booking.getUser().getEmail(),
                    "Nhắc lịch bảo dưỡng định kỳ - Smart Garage",
                    htmlContent
            );
            System.out.println("Đã gửi nhắc lịch cho khách hàng: " + booking.getUser().getEmail());
        }
    }
}
