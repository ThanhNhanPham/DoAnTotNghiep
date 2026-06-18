package com.example.smartgarage.service;

import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ResourceNotFoundException;
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
        LocalDateTime reminderWindowStart = LocalDateTime.now().minusMonths(6).withHour(0).withMinute(0);
        LocalDateTime reminderWindowEnd = reminderWindowStart.plusDays(1);

        List<Booking> listReminders = bookingRepository.findBookingsForReminder(reminderWindowStart, reminderWindowEnd);

        for (Booking booking : listReminders) {
            sendReminderForBooking(booking);
        }
    }

    public void sendReminderForBookingId(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Chỉ gửi nhắc bảo dưỡng cho booking đã hoàn thành.");
        }

        sendReminderForBooking(booking);
    }

    private void sendReminderForBooking(Booking booking) {
        if (booking.getUser() == null || booking.getUser().getEmail() == null || booking.getUser().getEmail().isBlank()) {
            throw new BadRequestException("Booking không có email khách hàng để gửi nhắc bảo dưỡng.");
        }
        if (booking.getVehicle() == null || booking.getVehicle().getModel() == null || booking.getVehicle().getModel().isBlank()) {
            throw new BadRequestException("Booking không có thông tin xe để gửi nhắc bảo dưỡng.");
        }

        String customerName = booking.getUser().getFullName() != null
                ? booking.getUser().getFullName()
                : "Quý khách";

        String htmlContent = templateService.buildMaintenanceReminderEmail(
                customerName,
                booking.getVehicle().getModel()
        );

        emailService.sendHtmlEmail(
                booking.getUser().getEmail(),
                "Nhắc lịch bảo dưỡng định kỳ - Smart Garage",
                htmlContent
        );
        System.out.println("Đã gửi nhắc lịch cho khách hàng: " + booking.getUser().getEmail());
    }
}
