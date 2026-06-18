package com.example.smartgarage.service;

import com.example.smartgarage.dto.InvoiceResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.PaymentInvoiceRepository;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class InvoiceService {
    private final PaymentInvoiceRepository paymentInvoiceRepository;
    private final UserRepository userRepository;

    public InvoiceService(PaymentInvoiceRepository paymentInvoiceRepository, UserRepository userRepository) {
        this.paymentInvoiceRepository = paymentInvoiceRepository;
        this.userRepository = userRepository;
    }
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesForCurrentUser(String status, String userName, int page , int size){
        User currentUser = userRepository.findByEmail(userName)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        PaymentStatus paymentStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                paymentStatus = PaymentStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
            }
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "issuedAt"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN;
        Page<PaymentInvoice> invoicePage;

        if (isAdmin) {
            invoicePage = paymentStatus == null
                    ? paymentInvoiceRepository.findAll(pageable)
                    : paymentInvoiceRepository.findByBookingPaymentStatus(paymentStatus, pageable);
        } else {
            invoicePage = paymentStatus == null
                    ? paymentInvoiceRepository.findByBookingUserEmail(userName, pageable)
                    : paymentInvoiceRepository.findByBookingUserEmailAndBookingPaymentStatus(userName, paymentStatus, pageable);
        }

        return invoicePage.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId, String currentUserEmail) {
        PaymentInvoice invoice = paymentInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId));
        ensureCanViewInvoice(invoice, currentUserEmail);
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByBookingId(Long bookingId, String currentUserEmail) {
        PaymentInvoice invoice = paymentInvoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn cho booking ID: " + bookingId));
        ensureCanViewInvoice(invoice, currentUserEmail);
        return mapToResponse(invoice);
    }

    private void ensureCanViewInvoice(PaymentInvoice invoice, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN) {
            return;
        }

        Booking booking = invoice.getBooking();
        if (booking == null || booking.getUser() == null || !currentUserEmail.equals(booking.getUser().getEmail())) {
            throw new ForbiddenException("Bạn không có quyền xem hóa đơn này.");
        }
    }

    @Transactional
    public void deleteInvoice(Long invoiceId) {
        if (!paymentInvoiceRepository.existsById(invoiceId)) {
            throw new ResourceNotFoundException("Không tìm thấy hóa đơn ID: " + invoiceId);
        }
        paymentInvoiceRepository.deleteById(invoiceId);
    }

    private InvoiceResponse mapToResponse(PaymentInvoice invoice) {
        Booking booking = invoice.getBooking();
        return InvoiceResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .bookingId(booking != null ? booking.getId() : null)
                .customerName(booking != null && booking.getUser() != null ? booking.getUser().getFullName() : null)
                .customerPhone(booking != null && booking.getUser() != null ? booking.getUser().getPhone() : null)
                .licensePlate(booking != null && booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null)
                .mechanicName(booking != null && booking.getMechanic() != null ? booking.getMechanic().getFullName() : null)
                .serviceNames(booking != null && booking.getBookedServices() != null
                        ? booking.getBookedServices().stream()
                        .map(bookedService -> bookedService.getService() != null ? bookedService.getService().getName() : null)
                        .filter(Objects::nonNull)
                        .toList()
                        : List.of())
                .serviceAmount(invoice.getServiceAmount())
                .partAmount(invoice.getPartAmount())
                .membershipTier(invoice.getMembershipTier())
                .membershipDiscountRate(invoice.getMembershipDiscountRate())
                .membershipDiscountAmount(invoice.getMembershipDiscountAmount())
                .finalAmount(invoice.getFinalAmount() != null ? invoice.getFinalAmount() : invoice.getAmount())
                .pointsEarned(invoice.getPointsEarned())
                .paymentMethod(invoice.getPaymentMethod())
                .paymentStatus(booking != null ? booking.getPaymentStatus() : null)
                .issuedAt(invoice.getIssuedAt())
                .note(invoice.getNote())
                .build();
    }
}
