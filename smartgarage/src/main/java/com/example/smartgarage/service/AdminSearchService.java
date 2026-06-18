package com.example.smartgarage.service;

import com.example.smartgarage.dto.admin.AdminSearchResponseDTO;
import com.example.smartgarage.dto.admin.AdminSearchResultDTO;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.PaymentInvoiceRepository;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminSearchService {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentInvoiceRepository paymentInvoiceRepository;

    public AdminSearchService(UserRepository userRepository,
                              BookingRepository bookingRepository,
                              PaymentInvoiceRepository paymentInvoiceRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentInvoiceRepository = paymentInvoiceRepository;
    }

    @Transactional(readOnly = true)
    public AdminSearchResponseDTO search(String keyword, int limit) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        int safeLimit = Math.min(Math.max(limit, 1), 10);

        if (normalizedKeyword.length() < 2) {
            return AdminSearchResponseDTO.builder()
                    .customers(List.of())
                    .bookings(List.of())
                    .invoices(List.of())
                    .build();
        }

        PageRequest pageRequest = PageRequest.of(0, safeLimit);
        return AdminSearchResponseDTO.builder()
                .customers(userRepository.searchCustomers(Role.CUSTOMER, normalizedKeyword, pageRequest).stream()
                        .map(this::mapCustomer)
                        .toList())
                .bookings(bookingRepository.searchAdminBookings(null, null, normalizedKeyword, pageRequest).stream()
                        .map(this::mapBooking)
                        .toList())
                .invoices(paymentInvoiceRepository.searchAdminInvoices(normalizedKeyword, pageRequest).stream()
                        .map(this::mapInvoice)
                        .toList())
                .build();
    }

    private AdminSearchResultDTO mapCustomer(User user) {
        return AdminSearchResultDTO.builder()
                .type("CUSTOMER")
                .id(user.getId())
                .title(user.getFullName() != null ? user.getFullName() : "Khách hàng #" + user.getId())
                .subtitle(joinParts(user.getPhone(), user.getEmail()))
                .route("/admin/users?userId=" + user.getId())
                .build();
    }

    private AdminSearchResultDTO mapBooking(Booking booking) {
        String customerName = booking.getUser() != null ? booking.getUser().getFullName() : null;
        String licensePlate = booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null;
        return AdminSearchResultDTO.builder()
                .type("BOOKING")
                .id(booking.getId())
                .title("Lịch hẹn #" + booking.getId())
                .subtitle(joinParts(customerName, licensePlate, booking.getStatus() != null ? booking.getStatus().name() : null))
                .route("/admin/bookings?bookingId=" + booking.getId())
                .build();
    }

    private AdminSearchResultDTO mapInvoice(PaymentInvoice invoice) {
        Booking booking = invoice.getBooking();
        String customerName = booking != null && booking.getUser() != null ? booking.getUser().getFullName() : null;
        String licensePlate = booking != null && booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null;
        return AdminSearchResultDTO.builder()
                .type("INVOICE")
                .id(invoice.getId())
                .title(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "Hóa đơn #" + invoice.getId())
                .subtitle(joinParts(customerName, licensePlate))
                .route("/admin/invoices?invoiceId=" + invoice.getId())
                .build();
    }

    private String joinParts(String... parts) {
        return java.util.Arrays.stream(parts)
                .filter(part -> part != null && !part.isBlank())
                .reduce((left, right) -> left + " - " + right)
                .orElse("");
    }
}
