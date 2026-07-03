package com.example.smartgarage.service;

import com.example.smartgarage.dto.*;
import com.example.smartgarage.dto.booking.AvailableBookingSlotResponse;
import com.example.smartgarage.dto.booking.BookingHistoryDTO;
import com.example.smartgarage.dto.booking.BookingRequest;
import com.example.smartgarage.dto.booking.BookingResponse;
import com.example.smartgarage.dto.booking.UpdateBookingRequest;
import com.example.smartgarage.entity.*;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.MechanicStatus;
import com.example.smartgarage.enums.MembershipTier;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.enums.Role;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.exception.ConflictException;
import com.example.smartgarage.exception.ForbiddenException;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private static final LocalTime DEFAULT_OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_CLOSE_TIME = LocalTime.of(18, 0);
    private static final List<BookingStatus> SLOT_BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ARRIVED,
            BookingStatus.IN_PROGRESS
    );
    private static final List<BookingStatus> MECHANIC_ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.CONFIRMED,
            BookingStatus.ARRIVED,
            BookingStatus.IN_PROGRESS
    );

    @Autowired private UserRepository userRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private MechanicRepository mechanicRepository;
    @Autowired private EmailService emailService;
    @Autowired private EmailTemplateService emailTemplateService;
    @Autowired private PartRepository partRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private MembershipService membershipService;
    @Transactional
    public Booking createBooking(String currentUserEmail, BookingRequest request) {
        // 1. Lấy User từ Email (đã xác thực qua JWT), không dùng ID từ Request để tránh giả mạo
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng đăng nhập"));

        // 2. Kiểm tra xe máy có thuộc quyền sở hữu của User này không (Bảo mật thêm)
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Xe này không thuộc sở hữu của bạn.");
        }
        Branch branch = branchRepository.findByIdForUpdate(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        if (!Boolean.TRUE.equals(branch.getIsActive())) {
            throw new ConflictException("Chi nhánh hiện không hoạt động.");
        }

        LocalDateTime arrivalSlotStart = request.getArrivalSlotStart() != null
                ? request.getArrivalSlotStart()
                : request.getBookingTime();
        LocalDateTime arrivalSlotEnd = request.getArrivalSlotEnd();

        if (arrivalSlotStart == null) {
            throw new BadRequestException("Bạn cần chọn thời gian bắt đầu khung giờ đến cửa hàng.");
        }
        if (arrivalSlotEnd == null) {
            throw new BadRequestException("Bạn cần chọn thời gian kết thúc khung giờ đến cửa hàng.");
        }
        if (!arrivalSlotEnd.isAfter(arrivalSlotStart)) {
            throw new BadRequestException("Khung giờ đến cửa hàng không hợp lệ.");
        }
        ensureSlotHasCapacity(branch.getId(), arrivalSlotStart, arrivalSlotEnd);

        // 3. Tạo thực thể Booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setVehicle(vehicle);
        booking.setBranch(branch);
        booking.setBookingTime(arrivalSlotStart);
        booking.setArrivalSlotStart(arrivalSlotStart);
        booking.setArrivalSlotEnd(arrivalSlotEnd);
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.PENDING);
        PaymentMethod paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH;
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus(PaymentStatus.UNPAID);

        applyServicesToBooking(booking, request.getServiceIds(), vehicle);
        applyMembershipPricing(booking);

        Booking savedBooking = bookingRepository.save(booking);
        notifyAdminsAboutNewBooking(savedBooking);
        return savedBooking;
    }

    private void notifyAdminsAboutNewBooking(Booking booking) {
        List<User> admins = findAdminNotificationRecipients(booking);
        if (admins.isEmpty()) {
            return;
        }

        String customerName = booking.getUser() != null && booking.getUser().getFullName() != null
                ? booking.getUser().getFullName()
                : "Khách hàng";
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chưa rõ chi nhánh";

        List<Notification> notifications = admins.stream().map(admin -> {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setTitle("Đặt lịch mới");
            notification.setContent(customerName + " vừa đặt lịch cho xe " + licensePlate + " tại " + branchName + ".");
            notification.setBookingId(booking.getId());
            return notification;
        }).collect(Collectors.toList());

        notificationRepository.saveAll(notifications);
    }

    private List<User> findAdminNotificationRecipients(Booking booking) {
        List<User> recipients = new ArrayList<>();
        Long branchId = booking.getBranch() != null ? booking.getBranch().getId() : null;

        if (branchId != null) {
            recipients.addAll(userRepository.findByRoleAndBranchId(Role.ADMIN, branchId));
        }

        recipients.addAll(userRepository.findByRoleIn(List.of(Role.SUPERADMIN)));

        return recipients.stream()
                .filter(user -> user.getId() != null)
                .distinct()
                .collect(Collectors.toList());
    }

    private void notifyCustomerAboutAdminCancellation(Booking booking, String reason) {
        if (booking.getUser() == null) {
            return;
        }

        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chi nhánh";

        Notification notification = new Notification();
        notification.setUser(booking.getUser());
        notification.setTitle("Lịch hẹn đã bị hủy");
        notification.setContent("Lịch hẹn cho xe " + licensePlate + " tại " + branchName
                + " đã bị hủy. Lý do: " + reason);
        notification.setBookingId(booking.getId());
        notificationRepository.save(notification);
    }

    private void notifyCustomerAboutAdminBookingUpdate(Booking booking, String title, String content) {
        if (booking.getUser() == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(booking.getUser());
        notification.setTitle(title);
        notification.setContent(content);
        notification.setBookingId(booking.getId());
        notificationRepository.save(notification);
    }

    private String buildBookingSummary(Booking booking) {
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chi nhánh";

        StringBuilder summary = new StringBuilder("Lịch hẹn cho xe ")
                .append(licensePlate)
                .append(" tại ")
                .append(branchName);

        if (booking.getArrivalSlotStart() != null && booking.getArrivalSlotEnd() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            summary.append(", thời gian ")
                    .append(booking.getArrivalSlotStart().format(formatter))
                    .append(" - ")
                    .append(booking.getArrivalSlotEnd().format(formatter));
        }

        return summary.toString();
    }
    private String buildBookingSummarySuccess(Booking booking) {
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chi nhánh";

        StringBuilder summary = new StringBuilder("Xe của bạn với biển số")
                .append(licensePlate)
                .append(" tại ")
                .append(branchName);

        if (booking.getArrivalSlotStart() != null && booking.getArrivalSlotEnd() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            summary.append(", thời gian ")
                    .append(booking.getArrivalSlotStart().format(formatter))
                    .append(" - ")
                    .append(booking.getArrivalSlotEnd().format(formatter));
        }
        return summary.toString();
    }

    private void notifyAdminsAboutCustomerCancellation(Booking booking, String reason) {
        List<User> admins = findAdminNotificationRecipients(booking);
        if (admins.isEmpty()) {
            return;
        }

        String customerName = booking.getUser() != null && booking.getUser().getFullName() != null
                ? booking.getUser().getFullName()
                : "Khách hàng";
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chưa rõ chi nhánh";

        List<Notification> notifications = admins.stream().map(admin -> {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setTitle("Khách hàng hủy lịch");
            notification.setContent(customerName + " đã hủy lịch cho xe " + licensePlate
                    + " tại " + branchName + ". Lý do: " + reason);
            notification.setBookingId(booking.getId());
            return notification;
        }).collect(Collectors.toList());

        notificationRepository.saveAll(notifications);
    }

    private void notifyAdminsAboutCustomerBookingUpdate(Booking booking) {
        List<User> admins = findAdminNotificationRecipients(booking);
        if (admins.isEmpty()) {
            return;
        }

        String customerName = booking.getUser() != null && booking.getUser().getFullName() != null
                ? booking.getUser().getFullName()
                : "Khách hàng";
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "chưa rõ chi nhánh";

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String timeText = booking.getArrivalSlotStart() != null && booking.getArrivalSlotEnd() != null
                ? ", khung giờ mới " + booking.getArrivalSlotStart().format(formatter)
                + " - " + booking.getArrivalSlotEnd().format(formatter)
                : "";

        List<Notification> notifications = admins.stream().map(admin -> {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setTitle("Khách hàng cập nhật lịch");
            notification.setContent(customerName + " vừa cập nhật lịch hẹn cho xe " + licensePlate
                    + " tại " + branchName + timeText + ".");
            notification.setBookingId(booking.getId());
            return notification;
        }).collect(Collectors.toList());

        notificationRepository.saveAll(notifications);
    }

    public List<BookingResponse> getAllBookings(String status) {
        List<Booking> bookings;
        if (status == null || status.isBlank()) {
            bookings = bookingRepository.findAll();
        } else {
            BookingStatus bookingStatus;
            try {
                bookingStatus = BookingStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
            }
            bookings = bookingRepository.findByStatus(bookingStatus);
        }
        return bookings.stream()
                .map(this::mapToResponse) // Gọi hàm mapToResponse cho từng phần tử
                .collect(Collectors.toList());
    }

    public Page<BookingResponse> getAllBookings(String status, Long branchId, String keyword, int page, int size) {
        BookingStatus bookingStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                bookingStatus = BookingStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
            }
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("id")
        ));
        String normalizedKeyword = keyword == null ? null : keyword.trim();

        return bookingRepository.searchAdminBookings(bookingStatus, branchId, normalizedKeyword, pageable)
                .map(this::mapToResponse);
    }

    public BookingResponse getBookingByIdForAdmin(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + bookingId));
        return mapToResponse(booking);
    }

    public void assertBookingInBranch(Long bookingId, Long branchId) {
        if (branchId == null) {
            return;
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + bookingId));

        if (booking.getBranch() == null || !Objects.equals(booking.getBranch().getId(), branchId)) {
            throw new ForbiddenException("Bạn chỉ được thao tác với lịch hẹn thuộc chi nhánh được phân công.");
        }
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId, String currentUserEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + bookingId));

        if (booking.getUser() == null || !booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new ForbiddenException("Bạn không có quyền xem lịch hẹn này.");
        }
        return mapToResponse(booking);
    }

    public BookingResponse mapToResponse(Booking booking) {
        List<BookedService> bookedServices = booking.getBookedServices() != null
                ? booking.getBookedServices()
                : java.util.Collections.emptyList();
        List<BookedPart> bookedParts = booking.getBookedParts() != null
                ? booking.getBookedParts()
                : java.util.Collections.emptyList();

        // 1. Tính tiền dịch vụ (Service)
        BigDecimal servicesTotal = booking.getServiceAmount() != null
                ? booking.getServiceAmount()
                : calculateServicesTotal(bookedServices);
        BigDecimal partsTotal = booking.getPartAmount() != null
                ? booking.getPartAmount()
                : calculatePartsTotal(bookedParts);
        MembershipTier tierApplied = booking.getMembershipTierApplied() != null
                ? booking.getMembershipTierApplied()
                : resolveBookingTier(booking);
        BigDecimal discountRate = booking.getMembershipDiscountRate() != null
                ? booking.getMembershipDiscountRate()
                : membershipService.resolveDiscountRate(tierApplied);
        BigDecimal discountAmount = booking.getMembershipDiscountAmount() != null
                ? booking.getMembershipDiscountAmount()
                : calculateMembershipDiscountAmount(servicesTotal, discountRate);
        BigDecimal finalTotal = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : servicesTotal.add(partsTotal).subtract(discountAmount);
        // 2. Map dữ liệu vào DTO
        return BookingResponse.builder()
                .id(booking.getId())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .bookingTime(booking.getBookingTime())
                .arrivalSlotStart(booking.getArrivalSlotStart())
                .arrivalSlotEnd(booking.getArrivalSlotEnd())
                .arrivalTime(booking.getArrivalTime())
                .repairStartTime(booking.getRepairStartTime())
                .repairEndTime(booking.getRepairEndTime())
                .customerName(booking.getUser() != null ? booking.getUser().getFullName() : "Khách vãng lai")
                .vehicleOwnerName(booking.getVehicleOwnerName())
                .customerPhone(booking.getUser() != null ? booking.getUser().getPhone() : "N/A")
                .vehicleId(booking.getVehicle() != null ? booking.getVehicle().getId() : null)
                .vehicleName(booking.getVehicle() != null ?
                        booking.getVehicle().getBrand() + " " + booking.getVehicle().getModel() : "N/A")
                .vehicleType(booking.getVehicle() != null ? booking.getVehicle().getType() : null)
                .vehicleImageUrl(booking.getVehicle() != null ? booking.getVehicle().getImageUrl() : null)
                .licensePlate(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : "N/A")
                .branchId(booking.getBranch() != null ? booking.getBranch().getId() : null)
                .branchName(booking.getBranch() != null ? booking.getBranch().getName() : "N/A")
                .mechanicName(booking.getMechanic() != null ? booking.getMechanic().getFullName() : "Chưa có thợ")
                .serviceIds(bookedServices.stream()
                        .filter(bs -> bs.getService() != null)
                        .map(bs -> bs.getService().getId())
                        .collect(Collectors.toList()))
                // Lấy danh sách tên dịch vụ
                .serviceNames(bookedServices.stream()
                        .filter(bs -> bs.getService() != null)
                        .map(bs -> bs.getService().getName())
                        .collect(Collectors.toList()))
                // Map danh sách tên Linh kiện (Phần mới thêm)
                .partNames(bookedParts.stream()
                        .filter(bp -> bp.getPart() != null)
                        .map(bp -> bp.getPart().getName())
                        .collect(Collectors.toList()))
                .note(booking.getNote())
                .cancelReason(booking.getCancelReason())
                .vehicleConditionBeforeRepair(booking.getVehicleConditionBeforeRepair())
                .serviceAmount(servicesTotal)
                .partAmount(partsTotal)
                .membershipTierApplied(tierApplied)
                .membershipDiscountRate(discountRate)
                .membershipDiscountAmount(discountAmount)
                .pointsEarned(booking.getPointsEarned())
                .finalAmount(finalTotal)
                .totalAmount(finalTotal)
                .paymentMethod(booking.getPaymentMethod())
                .paymentStatus(booking.getPaymentStatus())
                .build();
    }

    @Transactional
    public void cancelBooking(Long bookingId, String currentUserEmail, String reason) {
        Booking booking = getOwnedBooking(bookingId, currentUserEmail);
        ensureBookingPending(booking, "Chỉ có thể hủy lịch hẹn đang ở trạng thái PENDING.");
        restorePartStock(booking);
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        if (booking.getPaymentStatus() == PaymentStatus.PENDING) {
            booking.setPaymentStatus(PaymentStatus.CANCELLED);
        }
        Booking savedBooking = bookingRepository.save(booking);
        notifyAdminsAboutCustomerCancellation(savedBooking, reason);
    }

    @Transactional
    public BookingResponse cancelBookingForAdmin(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + bookingId));

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Chỉ có thể hủy lịch hẹn chưa hoàn tất và chưa bị hủy.");
        }

        restorePartStock(booking);
        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getPaymentStatus() == PaymentStatus.PENDING) {
            booking.setPaymentStatus(PaymentStatus.CANCELLED);
        }
        if (booking.getMechanic() != null) {
            releaseMechanicIfIdle(booking.getMechanic(), booking.getId());
        }
        booking.setCancelReason(reason);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminCancellation(savedBooking, reason);
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long mechanicId) {
        // 1. Tìm đơn hàng (Booking)
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + bookingId));

        // Kiểm tra nếu đơn hàng đã được xác nhận hoặc đã hoàn thành trước đó
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Đơn hàng này không ở trạng thái chờ (PENDING) để xác nhận.");
        }
            if (booking.getArrivalSlotEnd() != null && booking.getArrivalSlotEnd().isBefore(LocalDateTime.now())) {
            throw new ConflictException("Booking này đã quá hạn xác nhận vì lịch hẹn đã kết thúc.");
        }

        // 2. Tìm Thợ sửa xe (Mechanic)
        Mechanic mechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ ID: " + mechanicId));
        ensureMechanicAssignableToBooking(booking, mechanic);

        // 4. CẬP NHẬT TRẠNG THÁI
        // Gán thợ cho đơn hàng
        booking.setMechanic(mechanic);
        booking.setStatus(BookingStatus.CONFIRMED);

        // Chuyển trạng thái thợ sang "BUSY" để các Admin khác không gán thợ này vào đơn khác
        mechanic.setStatus(MechanicStatus.BUSY);

        // 5. LƯU THAY ĐỔI
        Booking savedBooking = bookingRepository.save(booking);
        mechanicRepository.save(mechanic); // Cần lưu lại trạng thái mới của thợ
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn đã được xác nhận",
                buildBookingSummary(savedBooking) + " đã được gara xác nhận."
        );
        sendBookingConfirmedEmail(savedBooking);

        // 6. TRẢ VỀ DTO (Sử dụng hàm mapper bạn đã viết)
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse markBookingArrived(Long bookingId) {
        Booking booking = getBookingByIdOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new ConflictException("Chỉ có thể ghi nhận khách đến khi lịch hẹn đang ở trạng thái CONFIRMED.");
        }
        booking.setArrivalTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.ARRIVED);
        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse startBooking(Long bookingId, String vehicleConditionBeforeRepair) {
        Booking booking = getBookingByIdOrThrow(bookingId);
        if (booking.getStatus() != BookingStatus.ARRIVED) {
            throw new ConflictException("Chỉ có thể bắt đầu xử lý khi lịch hẹn đang ở trạng thái ARRIVED.");
        }
        if (booking.getMechanic() == null) {
            throw new ConflictException("Booking chưa được gán thợ để bắt đầu xử lý.");
        }
        ensureMechanicNotRepairingAnotherBooking(booking.getMechanic(), booking.getId());

        String normalizedVehicleCondition = vehicleConditionBeforeRepair != null ? vehicleConditionBeforeRepair.trim() : "";
        if (normalizedVehicleCondition.isBlank()) {
            throw new BadRequestException("Vui lòng nhập tình trạng xe trước khi sửa.");
        }

        booking.setVehicleConditionBeforeRepair(normalizedVehicleCondition);
        booking.setRepairStartTime(LocalDateTime.now());
        booking.setRepairEndTime(null);
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.getMechanic().setStatus(MechanicStatus.BUSY);
        Booking savedBooking = bookingRepository.save(booking);
        mechanicRepository.save(booking.getMechanic());
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Xe đang được xử lý",
                buildBookingSummary(savedBooking) + " đã được gara đưa vào quy trình sửa chữa."
        );
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse reassignMechanic(Long bookingId, Long mechanicId) {
        Booking booking = getBookingByIdOrThrow(bookingId);
        if (!MECHANIC_ACTIVE_BOOKING_STATUSES.contains(booking.getStatus())) {
            throw new ConflictException("Chỉ có thể đổi thợ cho booking đang được xác nhận hoặc đang xử lý.");
        }
        if (booking.getMechanic() == null) {
            throw new ConflictException("Booking chưa có thợ để đổi. Hãy xác nhận và gán thợ trước.");
        }

        Mechanic currentMechanic = booking.getMechanic();
        if (Objects.equals(currentMechanic.getId(), mechanicId)) {
            throw new ConflictException("Thợ mới trùng với thợ đang phụ trách booking.");
        }

        Mechanic newMechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ ID: " + mechanicId));
        ensureMechanicAssignableToBooking(booking, newMechanic);

        booking.setMechanic(newMechanic);
        newMechanic.setStatus(MechanicStatus.BUSY);
        Booking savedBooking = bookingRepository.save(booking);
        mechanicRepository.save(newMechanic);
        releaseMechanicIfIdle(currentMechanic, savedBooking.getId());
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara điều chỉnh thợ phụ trách sang "
                        + newMechanic.getFullName() + "."
        );
        return mapToResponse(savedBooking);
    }

    public List<BookingHistoryDTO> getMyBookings(String email) {
        // Tìm User dựa trên email lấy từ token
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        // Lấy danh sách booking của User đó
        List<Booking> bookings = bookingRepository.findAllByUserIdOrderByBookingTimeDesc(user.getId());

        return bookings.stream()
                .map(BookingHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BookingResponse> getMyBookingResponses(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        return bookingRepository.findAllByUserIdOrderByBookingTimeDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AvailableBookingSlotResponse getAvailableSlots(Long branchId,
                                                          LocalDate date,
                                                          int slotDurationMinutes,
                                                          int slotIntervalMinutes) {
        if (date == null) {
            throw new BadRequestException("Ngày tra cứu không được để trống.");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Chỉ có thể tra cứu khung giờ từ hôm nay trở đi.");
        }
        if (slotIntervalMinutes > slotDurationMinutes) {
            throw new BadRequestException("Khoảng nhảy giữa các slot không được lớn hơn thời lượng mỗi slot.");
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
        if (!Boolean.TRUE.equals(branch.getIsActive())) {
            throw new ConflictException("Chi nhánh hiện không hoạt động.");
        }

        int branchCapacity = getActiveMechanicCapacity(branchId);
        if (branchCapacity <= 0) {
            throw new ConflictException("Chi nhánh hiện chưa có thợ khả dụng để nhận lịch.");
        }

        LocalDateTime businessStart = date.atTime(DEFAULT_OPEN_TIME);
        LocalDateTime businessEnd = date.atTime(DEFAULT_CLOSE_TIME);
        List<Booking> overlappingBookings = bookingRepository.findOverlappingBookings(
                branchId,
                SLOT_BLOCKING_STATUSES,
                businessStart,
                businessEnd
        );

        List<AvailableBookingSlotResponse.SlotItem> availableSlots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (LocalDateTime slotStart = businessStart;
             !slotStart.plusMinutes(slotDurationMinutes).isAfter(businessEnd);
             slotStart = slotStart.plusMinutes(slotIntervalMinutes)) {
            LocalDateTime slotEnd = slotStart.plusMinutes(slotDurationMinutes);
            if (slotStart.isBefore(now)) {
                continue;
            }
            LocalDateTime currentSlotStart = slotStart;
            LocalDateTime currentSlotEnd = slotEnd;

            long overlappingCount = overlappingBookings.stream()
                    .filter(booking -> booking.getArrivalSlotStart() != null && booking.getArrivalSlotEnd() != null)
                    .filter(booking -> booking.getArrivalSlotStart().isBefore(currentSlotEnd)
                            && booking.getArrivalSlotEnd().isAfter(currentSlotStart))
                    .count();
            int remainingCapacity = branchCapacity - (int) overlappingCount;
            if (remainingCapacity > 0) {
                availableSlots.add(AvailableBookingSlotResponse.SlotItem.builder()
                        .start(currentSlotStart)
                        .end(currentSlotEnd)
                        .remainingCapacity(remainingCapacity)
                        .build());
            }
        }

        return AvailableBookingSlotResponse.builder()
                .branchId(branch.getId())
                .date(date)
                .slotDurationMinutes(slotDurationMinutes)
                .slotIntervalMinutes(slotIntervalMinutes)
                .branchCapacity(branchCapacity)
                .slots(availableSlots)
                .build();
    }

    private void ensureSlotHasCapacity(Long branchId, LocalDateTime slotStart, LocalDateTime slotEnd) {
        int branchCapacity = getActiveMechanicCapacity(branchId);
        if (branchCapacity <= 0) {
            throw new ConflictException("Chi nhánh hiện chưa có thợ khả dụng để nhận lịch.");
        }

        long overlappingCount = bookingRepository.findOverlappingBookings(
                branchId,
                SLOT_BLOCKING_STATUSES,
                slotStart,
                slotEnd
        ).size();

        if (overlappingCount >= branchCapacity) {
            throw new ConflictException("Khung giờ này đã hết chỗ, vui lòng chọn khung giờ khác.");
        }
    }

    private int getActiveMechanicCapacity(Long branchId) {
        return (int) mechanicRepository.findByBranchId(branchId).stream()
                .filter(mechanic -> mechanic.getStatus() == MechanicStatus.ACTIVE)
                .count();
    }

    @Transactional
    public BookingResponse updateBooking(Long bookingId, String currentUserEmail, UpdateBookingRequest request) {
        Booking booking = getOwnedBooking(bookingId, currentUserEmail);
        ensureBookingPending(booking, "Chỉ có thể cập nhật lịch hẹn đang ở trạng thái PENDING.");

        Vehicle vehicle = booking.getVehicle();
        if (request.getVehicleId() != null) {
            vehicle = getOwnedVehicle(currentUserEmail, request.getVehicleId());
            booking.setVehicle(vehicle);
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh"));
            if (booking.getBookedParts() != null && !booking.getBookedParts().isEmpty()
                    && !Objects.equals(booking.getBranch().getId(), branch.getId())) {
                throw new ConflictException("Không thể đổi chi nhánh khi booking đã có linh kiện.");
            }
            booking.setBranch(branch);
        }

        LocalDateTime updatedStart = request.getArrivalSlotStart() != null ? request.getArrivalSlotStart() : booking.getArrivalSlotStart();
        LocalDateTime updatedEnd = request.getArrivalSlotEnd() != null ? request.getArrivalSlotEnd() : booking.getArrivalSlotEnd();
        if (updatedStart == null || updatedEnd == null) {
            throw new BadRequestException("Booking phải có đầy đủ khung giờ đến cửa hàng.");
        }
        if (!updatedEnd.isAfter(updatedStart)) {
            throw new BadRequestException("Khung giờ đến cửa hàng không hợp lệ.");
        }

        booking.setArrivalSlotStart(updatedStart);
        booking.setArrivalSlotEnd(updatedEnd);
        booking.setBookingTime(updatedStart);

        if (request.getServiceIds() != null) {
            applyServicesToBooking(booking, request.getServiceIds(), vehicle);
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        applyMembershipPricing(booking);
        Booking savedBooking = bookingRepository.save(booking);
        notifyAdminsAboutCustomerBookingUpdate(savedBooking);
        return mapToResponse(savedBooking);
    }

    public DashboardStatusDTO getDashboardStatus(Long branchId) {
        // 1. Đếm số lượng theo từng trạng thái
        long total = branchId != null ? bookingRepository.countByBranchId(branchId) : bookingRepository.count();
        long pending = countBookingsByBranchAndStatus(branchId, BookingStatus.PENDING);
        long confirmed = countBookingsByBranchAndStatus(branchId, BookingStatus.CONFIRMED);
        long completed = countBookingsByBranchAndStatus(branchId, BookingStatus.COMPLETED);
        long cancelled = countBookingsByBranchAndStatus(branchId, BookingStatus.CANCELLED);

        // 2. Tính tổng doanh thu
        BigDecimal revenue = branchId != null
                ? bookingRepository.calculateRevenueByPeriodAndBranch(
                        branchId,
                        BookingStatus.COMPLETED,
                        LocalDate.of(2000, 1, 1).atStartOfDay(),
                        LocalDate.now().atTime(LocalTime.MAX)
                )
                : bookingRepository.calculateRevenueByPeriod(
                        BookingStatus.COMPLETED,
                        LocalDate.of(2000, 1, 1).atStartOfDay(),
                        LocalDate.now().atTime(LocalTime.MAX)
                );
        if (revenue == null) revenue = BigDecimal.ZERO;

        // 3. Lấy Top 5 dịch vụ hay dùng nhất
        List<ServiceStatisticDTO> topServices = branchId != null
                ? bookingRepository.findTopServicesByBranch(branchId, PageRequest.of(0, 5))
                : bookingRepository.findTopServices(PageRequest.of(0, 5));

        // 4. Trả về kết quả tổng hợp
        return new DashboardStatusDTO(
                total,
                pending,
                confirmed,
                completed,
                cancelled,
                revenue,
                topServices
        );
    }

    private long countBookingsByBranchAndStatus(Long branchId, BookingStatus status) {
        return branchId != null
                ? bookingRepository.countByBranchIdAndStatus(branchId, status)
                : bookingRepository.countByStatus(status);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }
//
//    public byte[] exportBookingsToExcel() throws IOException {
//        List<Booking> bookings = bookingRepository.findAll();
//        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
//            Sheet sheet = workbook.createSheet("Danh sách lịch hẹn");
//            // 1. Tạo Styles
//            CellStyle headerStyle = createHeaderStyle(workbook);
//            CellStyle dateStyle = workbook.createCellStyle();
//            dateStyle.setDataFormat(workbook.createDataFormat().getFormat("dd/MM/yyyy HH:mm"));
//
//            CellStyle moneyStyle = workbook.createCellStyle();
//            moneyStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0")); // Định dạng phân cách hàng nghìn
//
//            // 1. Tạo Header (Dòng tiêu đề)
//            Row headerRow = sheet.createRow(0);
//            String[] columns = {"ID", "Khách hàng","Số điện thoại", "Biển số", "Ngày hẹn", "Trạng thái", "Tổng tiền"};
//
//            // Style cho Header (In đậm, nền xám)
//            Font font = workbook.createFont();
//            font.setBold(true);
//            headerStyle.setFont(font);
//            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
//            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
//
//            for (int i = 0; i < columns.length; i++) {
//                Cell cell = headerRow.createCell(i);
//                cell.setCellValue(columns[i]);
//                cell.setCellStyle(headerStyle);
//            }
//
//            // 2. Đổ dữ liệu vào các dòng tiếp theo
//            int rowIdx = 1;
//            for (Booking booking : bookings) {
//                Row row = sheet.createRow(rowIdx++);
//                row.createCell(0).setCellValue(booking.getId());
//                row.createCell(1).setCellValue(booking.getUser() != null ? booking.getUser().getFullName() : "N/A");
//                row.createCell(2).setCellValue(booking.getUser() != null ? booking.getUser().getPhone() : "N/A");
//                row.createCell(3).setCellValue(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : "N/A");
//                Cell dateCell = row.createCell(4);
//                if (booking.getBookingTime() != null) {
//                    dateCell.setCellValue(java.sql.Timestamp.valueOf(booking.getBookingTime()));
//                    dateCell.setCellStyle(dateStyle);
//                }
//                row.createCell(5).setCellValue(booking.getStatus().toString());
//
//                // Cột Tổng tiền (Lấy từ field totalAmount đã tính sẵn hoặc tính lại bằng BigDecimal)
//                Cell totalCell = row.createCell(6);
//                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
//                totalCell.setCellValue(total.doubleValue()); // POI nhận double nhưng Style sẽ định dạng lại
//                totalCell.setCellStyle(moneyStyle);
//            }
//            // Tự động căn chỉnh độ rộng cột
//            for (int i = 0; i < columns.length; i++) {
//                sheet.autoSizeColumn(i);
//            }
//
//            workbook.write(out);
//            return out.toByteArray();
//        }
//    }
//     private BookingResponse convertToResponse(Booking booking) {
//        BookingResponse response = new BookingResponse();
//
//        response.setId(booking.getId());
//        response.setStatus(booking.getStatus());
//        response.setBookingTime(booking.getBookingTime());
//        response.setArrivalSlotStart(booking.getArrivalSlotStart());
//        response.setArrivalSlotEnd(booking.getArrivalSlotEnd());
//        response.setArrivalTime(booking.getArrivalTime());
//
//        // 1. Xử lý tên khách hàng (Lấy tên, nếu trống thì lấy Email như đã làm ở file Excel)
//        if (booking.getUser() != null) {
//            String name = (booking.getUser().getFullName() != null && !booking.getUser().getFullName().isEmpty())
//                    ? booking.getUser().getFullName()
//                    : booking.getUser().getEmail();
//            response.setCustomerName(name);
//        }
//
//        // 2. Lấy thông tin thợ sửa (Nếu đã gán thợ)
//        if (booking.getMechanic() != null) {
//            response.setMechanicName(booking.getMechanic().getFullName());
//        } else {
//            response.setMechanicName("Chưa gán thợ");
//        }
//
//        // 3. Lấy biển số xe
//        if (booking.getVehicle() != null) {
//            response.setLicensePlate(booking.getVehicle().getLicensePlate());
//        }
//
//        // 4. Tính tổng tiền từ danh sách dịch vụ (Dùng BigDecimal để chính xác)
//        BigDecimal total = BigDecimal.ZERO;
//        if (booking.getBookedServices() != null) {
//            total = booking.getBookedServices().stream()
//                    .map(BookedService::getPriceAtBooking)
//                    .reduce(BigDecimal.ZERO, BigDecimal::add);
//        }
//        response.setTotalAmount(total);
//        response.setPaymentMethod(booking.getPaymentMethod());
//        response.setPaymentStatus(booking.getPaymentStatus());
//
//        return response;
//    }

    // Trong class BookingService
    @Transactional
    public BookingResponse completeBooking(Long id) {
        // 1. Tìm đơn hàng và Kiểm tra trạng thái
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + id));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new ConflictException("Chỉ có thể hoàn tất booking đang ở trạng thái IN_PROGRESS.");
        }

        // 2. Tính toán tổng tiền (Dịch vụ + Linh kiện)
        applyMembershipPricing(booking);
        BigDecimal finalTotal = booking.getFinalAmount() != null ? booking.getFinalAmount() : booking.getTotalAmount();

        // 3. Cập nhật trạng thái Booking và Giải phóng thợ
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setRepairEndTime(LocalDateTime.now());
        rewardPointsIfNeeded(booking);
        if (booking.getMechanic() != null) {
            releaseMechanicIfIdle(booking.getMechanic(), booking.getId());
        }

        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Đon hàng đã hoàn tất",
                buildBookingSummarySuccess(savedBooking) + " đã được hoàn tất. Tổng thanh toán: "
                        + String.format("%,.0f VNĐ", finalTotal) + "."
        );

        // 4. Gửi Email HTML (Sử dụng hàm bổ trợ đã viết ở bước trước)
        sendCompletionEmail(savedBooking, finalTotal);
        // 5. Chuyển đổi sang BookingResponse (Sử dụng Builder)
        return mapToResponse(savedBooking);
    }

    private void rewardPointsIfNeeded(Booking booking) {
        if (!Boolean.TRUE.equals(booking.getPointsRewarded())) {
            booking.setPointsEarned(MembershipService.POINTS_PER_COMPLETED_BOOKING);
            membershipService.rewardPoints(booking.getUser(), booking.getPointsEarned());
            booking.setPointsRewarded(true);
            userRepository.save(booking.getUser());
        } else if (booking.getPointsEarned() == null) {
            booking.setPointsEarned(MembershipService.POINTS_PER_COMPLETED_BOOKING);
        }
    }

    private void sendBookingConfirmedEmail(Booking booking) {
        if (booking.getUser() == null || booking.getUser().getEmail() == null || booking.getUser().getEmail().isBlank()) {
            return;
        }

        String customerName = booking.getUser().getFullName() != null ? booking.getUser().getFullName() : "Quý khách";
        String branchName = booking.getBranch() != null && booking.getBranch().getName() != null
                ? booking.getBranch().getName()
                : "Smart Garage";
        String licensePlate = booking.getVehicle() != null && booking.getVehicle().getLicensePlate() != null
                ? booking.getVehicle().getLicensePlate()
                : "chưa rõ biển số";
        String mechanicName = booking.getMechanic() != null && booking.getMechanic().getFullName() != null
                ? booking.getMechanic().getFullName()
                : "đang cập nhật";
        String arrivalWindow = formatArrivalWindow(booking);

        String htmlContent = emailTemplateService.buildBookingConfirmedEmail(
                customerName,
                booking.getId(),
                branchName,
                licensePlate,
                mechanicName,
                arrivalWindow
        );

        emailService.sendHtmlEmail(
                booking.getUser().getEmail(),
                "Smart Garage - Xác nhận lịch hẹn #" + booking.getId(),
                htmlContent
        );
    }

    private String formatArrivalWindow(Booking booking) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        if (booking.getArrivalSlotStart() != null && booking.getArrivalSlotEnd() != null) {
            return booking.getArrivalSlotStart().format(formatter) + " - " + booking.getArrivalSlotEnd().format(formatter);
        }
        if (booking.getBookingTime() != null) {
            return booking.getBookingTime().format(formatter);
        }
        return "Theo thông tin đã đặt";
    }

    private void sendCompletionEmail(Booking booking, BigDecimal total) {
        if (booking.getUser() == null || booking.getUser().getEmail() == null) return;

        String licensePlate = (booking.getVehicle() != null) ? booking.getVehicle().getLicensePlate() : "N/A";
        String customerName = (booking.getUser().getFullName() != null) ? booking.getUser().getFullName() : "Quý khách";

        // Tạo các dòng cho Dịch vụ
        String serviceRows = booking.getBookedServices().stream()
                .map(s -> String.format("<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Dịch vụ)</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>", s.getService().getName(), s.getPriceAtBooking()))
                .collect(Collectors.joining());

        // Tạo các dòng cho Linh kiện (Nếu có)
        String partRows = booking.getBookedParts().stream()
                .map(p -> String.format(
                        "<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Linh kiện) x%d</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>",
                        p.getPart().getName(),
                        p.getQuantity(),
                        p.getPriceAtBooking().multiply(BigDecimal.valueOf(p.getQuantity())).doubleValue()
                ))
                .collect(Collectors.joining());

        BigDecimal discountAmount = booking.getMembershipDiscountAmount() != null
                ? booking.getMembershipDiscountAmount()
                : BigDecimal.ZERO;
        BigDecimal discountRate = booking.getMembershipDiscountRate() != null
                ? booking.getMembershipDiscountRate()
                : BigDecimal.ZERO;
        String discountRateText = discountRate.compareTo(BigDecimal.ZERO) > 0
                ? " (" + discountRate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%)"
                : "";
        String discountRow = discountAmount.compareTo(BigDecimal.ZERO) > 0
                ? String.format(
                "<tr><td style='padding:8px; border-bottom:1px solid #eee; color:#198754;'>Giảm giá thành viên%s</td><td style='text-align:right; color:#198754;'>-%,.0f VNĐ</td></tr>",
                discountRateText,
                discountAmount
        )
                : "";

        String htmlContent = "<html><body style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; background-color: #f9f9f9; padding: 20px;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #e1e1e1;'>" +
                // Header
                "<div style='background-color: #007bff; color: #ffffff; padding: 30px; text-align: center;'>" +
                "<h1 style='margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;'>Smart Garage</h1>" +
                "<p style='margin: 5px 0 0; opacity: 0.8;'>Hóa Đơn Dịch Vụ Điện Tử</p>" +
                "</div>" +

                // Body Content
                "<div style='padding: 30px;'>" +
                "<p>Xin chào <b>" + customerName + "</b>,</p>" +
                "<p>Chúng tôi vui mừng thông báo rằng xe của bạn với biển số <b style='color: #007bff;'>" + licensePlate + "</b> đã được đội ngũ kỹ thuật hoàn tất sửa chữa và kiểm tra kỹ lưỡng.</p>" +

                "<div style='margin: 25px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;'>" +
                "<p style='margin: 0; font-size: 14px;'><b>Trạng thái:</b> Sẵn sàng bàn giao</p>" +
                "<p style='margin: 5px 0 0; font-size: 14px;'><b>Ngày hoàn thành:</b> " + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + "</p>" +
                "</div>" +

                // Table
                "<table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>" +
                "<thead>" +
                "<tr style='border-bottom: 2px solid #eee; text-align: left;'>" +
                "<th style='padding: 12px 0;'>Hạng mục chi tiết</th>" +
                "<th style='padding: 12px 0; text-align: right;'>Thành tiền</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>" + serviceRows + partRows + discountRow + "</tbody>" +
                "</table>" +

                // Total
                "<div style='border-top: 2px solid #eee; padding-top: 20px; text-align: right;'>" +
                "<span style='font-size: 16px; color: #777;'>Tổng thanh toán:</span>" +
                "<h2 style='margin: 5px 0; color: #d9534f; font-size: 28px;'>" + String.format("%,.0f", total) + " <span style='font-size: 18px;'>VNĐ</span></h2>" +
                "</div>" +

                "<p style='margin-top: 30px;'>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ tại <b>Smart Garage</b>. Chúng tôi rất hân hạnh được đồng hành cùng bạn trên mọi hành trình!</p>" +
                "<p style='font-weight: bold; color: #007bff;'>Hẹn gặp lại bạn!</p>" +
                "</div>" +

                // Footer
                "<div style='background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;'>" +
                "<p style='margin: 0;'>Đây là email thông báo tự động từ hệ thống quản lý Smart Garage.</p>" +
                "<p style='margin: 5px 0;'><b>Vui lòng không phản hồi lại email này.</b></p>" +
                "<p style='margin: 15px 0 0;'>&copy; 2026 Smart Garage System | Thủ Đưc, Hồ Chí Minh</p>" +
                "</div>" +
                "</div></body></html>";

        emailService.sendHtmlEmail(booking.getUser().getEmail(), "Hóa đơn hoàn tất - " + licensePlate, htmlContent);
    }

    @Transactional
    public BookingResponse addPartToBooking(Long bookingId, Long partId, int quantity) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        Part catalogPart = partRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện"));
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Không thể thêm linh kiện vào đơn hàng đã hoàn tất hoặc đã hủy.");
        }
        if (catalogPart.getQuantity() < quantity) {
            throw new ConflictException("Kho chỉ còn " + catalogPart.getQuantity() + " sản phẩm, không đủ để thêm.");
        }
        validatePartForBooking(catalogPart, booking);
        BookedPart bookedPart = findBookedPart(booking, partId).orElseGet(() -> {
            BookedPart newBookedPart = new BookedPart();
            newBookedPart.setBooking(booking);
            newBookedPart.setPart(catalogPart);
            newBookedPart.setQuantity(0);
            newBookedPart.setPriceAtBooking(catalogPart.getPrice());
            booking.getBookedParts().add(newBookedPart);
            return newBookedPart;
        });
        bookedPart.setQuantity(bookedPart.getQuantity() + quantity);
        catalogPart.setQuantity(catalogPart.getQuantity() - quantity);
        applyMembershipPricing(booking);
        partRepository.save(catalogPart); // Lưu lại số lượng kho mới
        bookingRepository.save(booking);
        return mapToResponse(booking);
    }

    private Booking getOwnedBooking(Long bookingId, String currentUserEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));
        if (booking.getUser() == null || !Objects.equals(booking.getUser().getEmail(), currentUserEmail)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên lịch hẹn này.");
        }
        return booking;
    }

    private Vehicle getOwnedVehicle(String currentUserEmail, Long vehicleId) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng đăng nhập"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe"));
        if (vehicle.getUser() == null || !Objects.equals(vehicle.getUser().getId(), user.getId())) {
            throw new ForbiddenException("Xe này không thuộc sở hữu của bạn.");
        }
        return vehicle;
    }

    private Booking getBookingByIdOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn ID: " + bookingId));
    }

    private void ensureMechanicAssignableToBooking(Booking booking, Mechanic mechanic) {
        if (mechanic.getStatus() != MechanicStatus.ACTIVE) {
            throw new ConflictException("Thợ " + mechanic.getFullName() + " hiện đang bận hoặc không sẵn sàng làm việc.");
        }
        if (mechanic.getBranch() == null || booking.getBranch() == null
                || !Objects.equals(mechanic.getBranch().getId(), booking.getBranch().getId())) {
            throw new ConflictException("Chỉ có thể gán thợ cùng chi nhánh với booking.");
        }
        ensureMechanicNotRepairingAnotherBooking(mechanic, booking.getId());
    }

    private void ensureMechanicNotRepairingAnotherBooking(Mechanic mechanic, Long currentBookingId) {
        long inProgressAssignments = bookingRepository.countByMechanicIdAndStatusInAndIdNot(
                mechanic.getId(),
                List.of(BookingStatus.IN_PROGRESS),
                currentBookingId
        );
        if (inProgressAssignments > 0) {
            throw new ConflictException("Thợ " + mechanic.getFullName() + " đang sửa xe khác. Vui lòng chờ hoàn tất hoặc chọn thợ khác.");
        }
    }

    private void releaseMechanicIfIdle(Mechanic mechanic, Long currentBookingId) {
        long activeAssignments = bookingRepository.countByMechanicIdAndStatusInAndIdNot(
                mechanic.getId(),
                MECHANIC_ACTIVE_BOOKING_STATUSES,
                currentBookingId
        );
        if (activeAssignments == 0) {
            mechanic.setStatus(MechanicStatus.ACTIVE);
            mechanicRepository.save(mechanic);
        }
    }

    private void ensureBookingPending(Booking booking, String message) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException(message);
        }
    }

    private void ensureBookingEditableForAdmin(Booking booking, String message) {
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException(message);
        }
    }

    private void applyServicesToBooking(Booking booking, List<Long> serviceIds, Vehicle vehicle) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            throw new BadRequestException("Bạn cần chọn ít nhất một dịch vụ.");
        }

        Set<Long> requestedServiceIds = new LinkedHashSet<>(serviceIds);
        List<com.example.smartgarage.entity.Service> selectedServices = serviceRepository.findAllById(requestedServiceIds);
        if (selectedServices.size() != requestedServiceIds.size()) {
            throw new BadRequestException("Có dịch vụ không tồn tại trong hệ thống.");
        }
        selectedServices.forEach(service -> validateServiceForVehicle(service, vehicle));

        if (booking.getBookedServices() == null) {
            booking.setBookedServices(new ArrayList<>());
        }

        booking.getBookedServices().removeIf(bookedService ->
                bookedService.getService() == null || !requestedServiceIds.contains(bookedService.getService().getId())
        );

        Set<Long> existingServiceIds = booking.getBookedServices().stream()
                .filter(bookedService -> bookedService.getService() != null)
                .map(bookedService -> bookedService.getService().getId())
                .collect(Collectors.toSet());

        selectedServices.forEach(service -> {
            if (existingServiceIds.contains(service.getId())) {
                booking.getBookedServices().stream()
                        .filter(bookedService -> bookedService.getService() != null
                                && Objects.equals(bookedService.getService().getId(), service.getId()))
                        .findFirst()
                        .ifPresent(bookedService -> bookedService.setPriceAtBooking(service.getPrice()));
                return;
            }

            booking.getBookedServices().add(BookedService.builder()
                    .booking(booking)
                    .service(service)
                    .priceAtBooking(service.getPrice())
                    .build());
        });
    }

    private void applyMembershipPricing(Booking booking) {
        BigDecimal serviceAmount = calculateServiceAmount(booking);
        BigDecimal partAmount = calculatePartAmount(booking);
        MembershipTier tierApplied = resolveBookingTier(booking);
        BigDecimal discountRate = membershipService.resolveDiscountRate(tierApplied);
        BigDecimal discountAmount = calculateMembershipDiscountAmount(serviceAmount, discountRate);
        BigDecimal finalAmount = serviceAmount.add(partAmount).subtract(discountAmount);

        booking.setServiceAmount(serviceAmount);
        booking.setPartAmount(partAmount);
        booking.setMembershipTierApplied(tierApplied);
        booking.setMembershipDiscountRate(discountRate);
        booking.setMembershipDiscountAmount(discountAmount);
        booking.setFinalAmount(finalAmount);
        booking.setTotalAmount(finalAmount);
    }

    private MembershipTier resolveBookingTier(Booking booking) {
        if (booking.getUser() == null) {
            return MembershipTier.REGULAR;
        }
        if (booking.getUser().getMembershipTier() != null) {
            return booking.getUser().getMembershipTier();
        }
        int loyaltyPoints = booking.getUser().getLoyaltyPoints() != null ? booking.getUser().getLoyaltyPoints() : 0;
        return membershipService.resolveTier(loyaltyPoints);
    }

    private BigDecimal calculateMembershipDiscountAmount(BigDecimal serviceAmount, BigDecimal discountRate) {
        BigDecimal normalizedServiceAmount = serviceAmount != null ? serviceAmount : BigDecimal.ZERO;
        BigDecimal normalizedDiscountRate = discountRate != null ? discountRate : BigDecimal.ZERO;
        return normalizedServiceAmount.multiply(normalizedDiscountRate);
    }

    private BigDecimal calculateBookingTotal(Booking booking) {
        applyMembershipPricing(booking);
        return booking.getFinalAmount();
    }

    private BigDecimal calculateServiceAmount(Booking booking) {
        List<BookedService> bookedServices = booking.getBookedServices() != null
                ? booking.getBookedServices()
                : java.util.Collections.emptyList();
        return calculateServicesTotal(bookedServices);
    }

    private BigDecimal calculatePartAmount(Booking booking) {
        List<BookedPart> bookedParts = booking.getBookedParts() != null
                ? booking.getBookedParts()
                : java.util.Collections.emptyList();
        return calculatePartsTotal(bookedParts);
    }

    private BigDecimal calculateServicesTotal(List<BookedService> bookedServices) {
        return bookedServices.stream()
                .map(bs -> bs.getPriceAtBooking() != null ? bs.getPriceAtBooking() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validateServiceForVehicle(com.example.smartgarage.entity.Service service, Vehicle vehicle) {
        if (!Boolean.TRUE.equals(service.getIsActive())) {
            throw new ConflictException("Dịch vụ " + service.getName() + " hiện không hoạt động.");
        }
        if (service.getType() != vehicle.getType()) {
            throw new BadRequestException("Dịch vụ " + service.getName() + " không phù hợp với loại xe đã chọn.");
        }
    }

    private BigDecimal calculatePartsTotal(List<BookedPart> bookedParts) {
        return bookedParts.stream()
                .map(bp -> {
                    BigDecimal price = bp.getPriceAtBooking() != null ? bp.getPriceAtBooking() : BigDecimal.ZERO;
                    BigDecimal qty = BigDecimal.valueOf(bp.getQuantity() != null ? bp.getQuantity() : 0);
                    return price.multiply(qty);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validatePartForBooking(Part part, Booking booking) {
        if (part.getBranch() == null || booking.getBranch() == null
                || !Objects.equals(part.getBranch().getId(), booking.getBranch().getId())) {
            throw new ConflictException("Chỉ có thể thêm linh kiện thuộc cùng chi nhánh với booking.");
        }
    }

    private void restorePartStock(Booking booking) {
        if (booking.getBookedParts() == null || booking.getBookedParts().isEmpty()) {
            return;
        }

        for (BookedPart bookedPart : booking.getBookedParts()) {
            if (bookedPart.getPart() == null || bookedPart.getQuantity() == null || bookedPart.getQuantity() <= 0) {
                continue;
            }
            Part part = bookedPart.getPart();
            part.setQuantity(part.getQuantity() + bookedPart.getQuantity());
            partRepository.save(part);
        }
    }

    private Optional<BookedPart> findBookedPart(Booking booking, Long partId) {
        return booking.getBookedParts().stream()
                .filter(bookedPart -> bookedPart.getPart() != null && Objects.equals(bookedPart.getPart().getId(), partId))
                .findFirst();
    }

    @Transactional
    public BookingResponse updateBookingPart(Long bookingId, Long partId, int quantity) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Không thể cập nhật linh kiện của đơn hàng đã hoàn tất hoặc đã hủy.");
        }

        BookedPart bookedPart = findBookedPart(booking, partId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện trong đơn hàng"));
        Part catalogPart = bookedPart.getPart();
        validatePartForBooking(catalogPart, booking);

        int currentQuantity = bookedPart.getQuantity();
        int delta = quantity - currentQuantity;
        if (delta > 0 && catalogPart.getQuantity() < delta) {
            throw new ConflictException("Kho chỉ còn " + catalogPart.getQuantity() + " sản phẩm, không đủ để cập nhật.");
        }

        bookedPart.setQuantity(quantity);
        catalogPart.setQuantity(catalogPart.getQuantity() - delta);
        applyMembershipPricing(booking);

        partRepository.save(catalogPart);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara cập nhật linh kiện "
                        + catalogPart.getName() + " thành số lượng " + quantity + ". Tổng tạm tính mới: "
                        + String.format("%,.0f VNĐ", savedBooking.getTotalAmount()) + "."
        );
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse removeBookingPart(Long bookingId, Long partId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Không thể xóa linh kiện khỏi đơn hàng đã hoàn tất hoặc đã hủy.");
        }

        BookedPart bookedPart = findBookedPart(booking, partId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện trong đơn hàng"));
        Part catalogPart = bookedPart.getPart();
        catalogPart.setQuantity(catalogPart.getQuantity() + bookedPart.getQuantity());

        booking.getBookedParts().remove(bookedPart);
        applyMembershipPricing(booking);

        partRepository.save(catalogPart);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara cập nhật bằng cách xóa linh kiện "
                        + catalogPart.getName() + ". Tổng tạm tính mới: "
                        + String.format("%,.0f VNĐ", savedBooking.getTotalAmount()) + "."
        );
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse addServiceToBooking(Long bookingId, Long serviceId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        ensureBookingEditableForAdmin(booking, "Không thể thêm dịch vụ vào đơn hàng đã hoàn tất hoặc đã hủy.");

        com.example.smartgarage.entity.Service catalogService = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ"));
        validateServiceForVehicle(catalogService, booking.getVehicle());

        boolean exists = booking.getBookedServices().stream()
                .anyMatch(bookedService -> bookedService.getService() != null
                        && Objects.equals(bookedService.getService().getId(), serviceId));
        if (exists) {
            throw new ConflictException("Dịch vụ đã tồn tại trong booking.");
        }

        BookedService bookedService = BookedService.builder()
                .booking(booking)
                .service(catalogService)
                .priceAtBooking(catalogService.getPrice())
                .build();
        booking.getBookedServices().add(bookedService);
        applyMembershipPricing(booking);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara bổ sung dịch vụ "
                        + catalogService.getName() + ". Tổng tạm tính mới: "
                        + String.format("%,.0f VNĐ", savedBooking.getTotalAmount()) + "."
        );
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse replaceBookingServices(Long bookingId, List<Long> serviceIds) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        ensureBookingEditableForAdmin(booking, "Không thể cập nhật dịch vụ của đơn hàng đã hoàn tất hoặc đã hủy.");
        applyServicesToBooking(booking, serviceIds, booking.getVehicle());
        applyMembershipPricing(booking);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara cập nhật danh sách dịch vụ. Tổng tạm tính mới: "
                        + String.format("%,.0f VNĐ", savedBooking.getTotalAmount()) + "."
        );
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse removeBookingService(Long bookingId, Long serviceId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        ensureBookingEditableForAdmin(booking, "Không thể xóa dịch vụ khỏi đơn hàng đã hoàn tất hoặc đã hủy.");

        BookedService bookedService = booking.getBookedServices().stream()
                .filter(item -> item.getService() != null && Objects.equals(item.getService().getId(), serviceId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dịch vụ trong đơn hàng"));

        if (booking.getBookedServices().size() <= 1) {
            throw new ConflictException("Booking phải có ít nhất một dịch vụ.");
        }

        booking.getBookedServices().remove(bookedService);
        applyMembershipPricing(booking);
        Booking savedBooking = bookingRepository.save(booking);
        notifyCustomerAboutAdminBookingUpdate(
                savedBooking,
                "Lịch hẹn được cập nhật",
                buildBookingSummary(savedBooking) + " đã được gara cập nhật bằng cách xóa dịch vụ "
                        + bookedService.getService().getName() + ". Tổng tạm tính mới: "
                        + String.format("%,.0f VNĐ", savedBooking.getTotalAmount()) + "."
        );
        return mapToResponse(savedBooking);
    }
}
