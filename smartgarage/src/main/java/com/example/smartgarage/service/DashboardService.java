package com.example.smartgarage.service;

import com.example.smartgarage.dto.dashboard.DashboardOverviewDTO;
import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.dto.dashboard.RecentBookingDTO;
import com.example.smartgarage.dto.dashboard.RevenueSummaryDTO;
import com.example.smartgarage.dto.dashboard.RevenueTrendPointDTO;
import com.example.smartgarage.dto.ServiceStatisticDTO;
import com.example.smartgarage.dto.dashboard.StatusCountDTO;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.exception.BadRequestException;
import com.example.smartgarage.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class DashboardService {
    private final BookingRepository bookingRepository;

    public DashboardService(@Autowired BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public DashboardStatusDTO getDashboardStatus(Long branchId) {
        DashboardStatusDTO dto = new DashboardStatusDTO();
        dto.setTotalBookings(countBookings(branchId));
        dto.setPendingBookings(countBookingsByStatus(branchId, BookingStatus.PENDING));
        dto.setConfirmedBookings(countBookingsByStatus(branchId, BookingStatus.CONFIRMED));
        dto.setCompletedBookings(countBookingsByStatus(branchId, BookingStatus.COMPLETED));
        dto.setCancelledBookings(countBookingsByStatus(branchId, BookingStatus.CANCELLED));

        BigDecimal revenue = bookingRepository.calculateRevenueByPeriod(
                BookingStatus.COMPLETED,
                LocalDate.of(2000, 1, 1).atStartOfDay(),
                LocalDate.now().atTime(LocalTime.MAX)
        );
        if (branchId != null) {
            revenue = bookingRepository.calculateRevenueByPeriodAndBranch(
                    branchId,
                    BookingStatus.COMPLETED,
                    LocalDate.of(2000, 1, 1).atStartOfDay(),
                    LocalDate.now().atTime(LocalTime.MAX)
            );
        }
        dto.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);
        dto.setTopServices(findTopServices(branchId, 5));
        return dto;
    }

    public DashboardOverviewDTO getDashboardOverview(Long branchId) {
        DashboardStatusDTO status = getDashboardStatus(branchId);
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(DayOfWeek.MONDAY);
        LocalDate startOfMonth = today.withDayOfMonth(1);

        return DashboardOverviewDTO.builder()
                .totalBookings(status.getTotalBookings())
                .pendingBookings(status.getPendingBookings())
                .confirmedBookings(status.getConfirmedBookings())
                .completedBookings(status.getCompletedBookings())
                .cancelledBookings(status.getCancelledBookings())
                .newBookingsToday(countNewBookingsToday(branchId, today))
                .totalRevenue(status.getTotalRevenue())
                .revenueToday(getRevenueOrZero(branchId, today, today))
                .revenueThisWeek(getRevenueOrZero(branchId, startOfWeek, today))
                .revenueThisMonth(getRevenueOrZero(branchId, startOfMonth, today))
                .build();
    }

    public List<StatusCountDTO> getBookingStatusDistribution(Long branchId) {
        List<Object[]> rows = branchId != null
                ? bookingRepository.countAllStatusRawByBranch(branchId)
                : bookingRepository.countAllStatusRaw();
        return rows.stream()
                .map(item -> new StatusCountDTO(
                        item[0] != null ? item[0].toString() : null,
                        item[1] instanceof Number ? ((Number) item[1]).longValue() : 0L
                ))
                .toList();
    }

    public RevenueSummaryDTO getRevenueSummary(Long branchId, String period, LocalDate from, LocalDate to) {
        LocalDateRange range = resolveDateRange(period, from, to);
        BigDecimal revenue = getRevenueOrZero(branchId, range.from(), range.to());
        long completedBookings = countCompletedBookings(branchId, range);
        BigDecimal averageOrderValue = calculateAverageOrderValue(branchId, range);

        return RevenueSummaryDTO.builder()
                .period(period != null && !period.isBlank() ? period : "custom")
                .from(range.from().toString())
                .to(range.to().toString())
                .revenue(revenue)
                .completedBookings(completedBookings)
                .averageOrderValue(averageOrderValue != null ? averageOrderValue : BigDecimal.ZERO)
                .build();
    }

    public List<RevenueTrendPointDTO> getRevenueTrend(Long branchId, String groupBy, LocalDate from, LocalDate to) {
        if (!"day".equalsIgnoreCase(groupBy) && !"month".equalsIgnoreCase(groupBy)) {
            throw new BadRequestException("groupBy chỉ hỗ trợ day hoặc month.");
        }
        LocalDateRange range = resolveDateRange(null, from, to);
        String normalizedGroupBy = groupBy.trim().toLowerCase();
        String formatPattern = "day".equals(normalizedGroupBy) ? "YYYY-MM-DD" : "YYYY-MM";

        List<Object[]> rows = branchId != null
                ? bookingRepository.findRevenueTrendRawByBranch(
                        branchId,
                        BookingStatus.COMPLETED.name(),
                        normalizedGroupBy,
                        formatPattern,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                )
                : bookingRepository.findRevenueTrendRaw(
                        BookingStatus.COMPLETED.name(),
                        normalizedGroupBy,
                        formatPattern,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                );

        return rows.stream()
                .map(row -> RevenueTrendPointDTO.builder()
                        .label(row[0] != null ? row[0].toString() : null)
                        .revenue(toBigDecimal(row[1]))
                        .completedBookings(row[2] instanceof Number ? ((Number) row[2]).longValue() : 0L)
                        .build())
                .toList();
    }

    public List<ServiceStatisticDTO> getTopServices(Long branchId, int limit) {
        return findTopServices(branchId, limit);
    }

    public List<RecentBookingDTO> getRecentBookings(Long branchId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        int safeRecentLimit = Math.min(Math.max(limit, 1), 50);
        PageRequest pageRequest = PageRequest.of(
                        0,
                        safeRecentLimit,
                        Sort.by(Sort.Order.desc("bookingTime"), Sort.Order.desc("id"))
                );
        return (branchId != null
                ? bookingRepository.findAllByBranchId(branchId, pageRequest)
                : bookingRepository.findAll(pageRequest))
                .stream()
                .map(this::mapToRecentBooking)
                .toList();
    }

    private RecentBookingDTO mapToRecentBooking(Booking booking) {
        return RecentBookingDTO.builder()
                .bookingId(booking.getId())
                .customerName(booking.getUser() != null ? booking.getUser().getFullName() : null)
                .customerPhone(booking.getUser() != null ? booking.getUser().getPhone() : null)
                .vehicleName(booking.getVehicle() != null
                        ? booking.getVehicle().getBrand() + " " + booking.getVehicle().getModel()
                        : null)
                .licensePlate(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : null)
                .branchName(booking.getBranch() != null ? booking.getBranch().getName() : null)
                .bookingTime(booking.getBookingTime())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .totalAmount(booking.getTotalAmount())
                .paymentStatus(booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null)
                .build();
    }

    private long countBookings(Long branchId) {
        return branchId != null ? bookingRepository.countByBranchId(branchId) : bookingRepository.count();
    }

    private long countBookingsByStatus(Long branchId, BookingStatus status) {
        return branchId != null
                ? bookingRepository.countByBranchIdAndStatus(branchId, status)
                : bookingRepository.countByStatus(status);
    }

    private long countNewBookingsToday(Long branchId, LocalDate today) {
        return branchId != null
                ? bookingRepository.countNewBookingsTodayByBranch(branchId, today.atStartOfDay())
                : bookingRepository.countNewBookingsToday(today.atStartOfDay());
    }

    private BigDecimal getRevenueOrZero(Long branchId, LocalDate from, LocalDate to) {
        BigDecimal revenue = branchId != null
                ? bookingRepository.calculateRevenueByPeriodAndBranch(
                        branchId,
                        BookingStatus.COMPLETED,
                        from.atStartOfDay(),
                        to.atTime(LocalTime.MAX)
                )
                : bookingRepository.calculateRevenueByPeriod(
                        BookingStatus.COMPLETED,
                        from.atStartOfDay(),
                        to.atTime(LocalTime.MAX)
                );
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private long countCompletedBookings(Long branchId, LocalDateRange range) {
        return branchId != null
                ? bookingRepository.countByBranchIdAndStatusAndBookingTimeBetween(
                        branchId,
                        BookingStatus.COMPLETED,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                )
                : bookingRepository.countByStatusAndBookingTimeBetween(
                        BookingStatus.COMPLETED,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                );
    }

    private BigDecimal calculateAverageOrderValue(Long branchId, LocalDateRange range) {
        return branchId != null
                ? bookingRepository.calculateAverageOrderValueByPeriodAndBranch(
                        branchId,
                        BookingStatus.COMPLETED,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                )
                : bookingRepository.calculateAverageOrderValueByPeriod(
                        BookingStatus.COMPLETED,
                        range.from().atStartOfDay(),
                        range.to().atTime(LocalTime.MAX)
                );
    }

    private List<ServiceStatisticDTO> findTopServices(Long branchId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        return branchId != null
                ? bookingRepository.findTopServicesByBranch(branchId, PageRequest.of(0, safeLimit))
                : bookingRepository.findTopServices(PageRequest.of(0, safeLimit));
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private LocalDateRange resolveDateRange(String period, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            if (to.isBefore(from)) {
                throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu.");
            }
            return new LocalDateRange(from, to);
        }

        LocalDate today = LocalDate.now();
        if (period == null || period.isBlank()) {
            return new LocalDateRange(today.withDayOfMonth(1), today);
        }

        return switch (period.trim().toLowerCase()) {
            case "today" -> new LocalDateRange(today, today);
            case "week" -> new LocalDateRange(today.with(DayOfWeek.MONDAY), today);
            case "month" -> new LocalDateRange(today.withDayOfMonth(1), today);
            case "year" -> new LocalDateRange(today.withDayOfYear(1), today);
            default -> throw new BadRequestException("period chỉ hỗ trợ today, week, month, year.");
        };
    }

    private record LocalDateRange(LocalDate from, LocalDate to) {
    }
}
