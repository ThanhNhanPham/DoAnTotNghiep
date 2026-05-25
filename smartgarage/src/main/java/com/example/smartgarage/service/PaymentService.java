package com.example.smartgarage.service;

import com.example.smartgarage.dto.PaymentStatusResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.PaymentInvoiceRepository;
import com.example.smartgarage.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PaymentService {
    private final BookingRepository bookingRepository;
    private final PaymentInvoiceRepository paymentInvoiceRepository;
    private final UserRepository userRepository;

    public PaymentService(
            BookingRepository bookingRepository,
            PaymentInvoiceRepository paymentInvoiceRepository,
            UserRepository userRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentInvoiceRepository = paymentInvoiceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PaymentStatusResponse confirmCashPayment(Long bookingId) {
        Booking booking = getBooking(bookingId);

        if (booking.getPaymentMethod() != PaymentMethod.CASH) {
            throw new RuntimeException("Booking này không được cấu hình thanh toán tiền mặt.");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Chỉ có thể xác nhận thanh toán cho booking đã hoàn tất.");
        }

        PaymentInvoice invoice = finalizeSuccessfulPaymentIfNeeded(
                booking,
                PaymentMethod.CASH,
                "Thanh toán tiền mặt tại gara"
        );

        bookingRepository.save(booking);
        return buildPaymentStatusResponse(booking, Optional.ofNullable(invoice));
    }

    @Transactional
    public PaymentStatusResponse confirmBankTransferPayment(Long bookingId) {
        Booking booking = getBooking(bookingId);

        if (booking.getPaymentMethod() != PaymentMethod.BANK_TRANSFER) {
            throw new RuntimeException("Booking này không được cấu hình thanh toán chuyển khoản.");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Chỉ có thể xác nhận thanh toán cho booking đã hoàn tất.");
        }

        PaymentInvoice invoice = finalizeSuccessfulPaymentIfNeeded(
                booking,
                PaymentMethod.BANK_TRANSFER,
                "Xác nhận thanh toán chuyển khoản"
        );

        bookingRepository.save(booking);
        return buildPaymentStatusResponse(booking, Optional.ofNullable(invoice));
    }

    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Long bookingId, String currentUserEmail) {
        Booking booking = getBooking(bookingId);
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPERADMIN;
        if (!isAdmin && !booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException("Bạn không có quyền xem trạng thái thanh toán của booking này.");
        }

        Optional<PaymentInvoice> invoice = paymentInvoiceRepository.findByBookingId(bookingId);
        return buildPaymentStatusResponse(booking, invoice);
    }

    private Booking getBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));
    }

    private PaymentInvoice finalizeSuccessfulPaymentIfNeeded(Booking booking, PaymentMethod method, String note) {
        Optional<PaymentInvoice> existingInvoice = paymentInvoiceRepository.findByBookingId(booking.getId());
        if (booking.getPaymentStatus() == PaymentStatus.SUCCESS && existingInvoice.isPresent()) {
            return existingInvoice.get();
        }

        booking.setPaymentStatus(PaymentStatus.SUCCESS);

        if (booking.getPointsEarned() == null) {
            booking.setPointsEarned(MembershipService.POINTS_PER_COMPLETED_BOOKING);
        }

        return issueInvoice(booking, method, note, existingInvoice.orElse(null));
    }

    private PaymentInvoice issueInvoice(Booking booking, PaymentMethod method, String note, PaymentInvoice existingInvoice) {
        PaymentInvoice invoice = existingInvoice != null
                ? existingInvoice
                : PaymentInvoice.builder()
                .invoiceNumber(generateInvoiceNumber(booking.getId()))
                .booking(booking)
                .build();

        invoice.setAmount(booking.getTotalAmount());
        invoice.setServiceAmount(booking.getServiceAmount());
        invoice.setPartAmount(booking.getPartAmount());
        invoice.setMembershipTier(booking.getMembershipTierApplied());
        invoice.setMembershipDiscountRate(booking.getMembershipDiscountRate());
        invoice.setMembershipDiscountAmount(booking.getMembershipDiscountAmount());
        invoice.setPointsEarned(booking.getPointsEarned());
        invoice.setFinalAmount(booking.getFinalAmount() != null ? booking.getFinalAmount() : booking.getTotalAmount());
        invoice.setPaymentMethod(booking.getPaymentMethod());
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setNote(note);

        return paymentInvoiceRepository.save(invoice);
    }

    private PaymentStatusResponse buildPaymentStatusResponse(Booking booking, Optional<PaymentInvoice> invoice) {
        PaymentMethod method = invoice.map(PaymentInvoice::getPaymentMethod)
                .orElseGet(() -> switch (booking.getPaymentMethod()) {
                    case CASH -> PaymentMethod.CASH;
                    case BANK_TRANSFER -> PaymentMethod.BANK_TRANSFER;
                });

        return PaymentStatusResponse.builder()
                .bookingId(booking.getId())
                .paymentMethod(booking.getPaymentMethod())
                .paymentStatus(booking.getPaymentStatus())
                .amount(booking.getFinalAmount() != null ? booking.getFinalAmount() : booking.getTotalAmount())
                .build();
    }

    private String generateInvoiceNumber(Long bookingId) {
        return "INV-" + bookingId + "-" + System.currentTimeMillis();
    }
}
