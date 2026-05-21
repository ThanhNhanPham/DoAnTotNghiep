package com.example.smartgarage.controller;

import com.example.smartgarage.dto.booking.BookingRequest;
import com.example.smartgarage.dto.booking.BookingResponse;
import com.example.smartgarage.dto.booking.UpdateBookingRequest;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.exception.GlobalExceptionHandler;
import com.example.smartgarage.service.BookingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BookingControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private StubBookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new StubBookingService();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new BookingController(bookingService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createBooking_returnsCreatedBooking() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setVehicleId(10L);
        request.setBranchId(2L);
        request.setArrivalSlotStart(LocalDateTime.of(2026, 5, 20, 9, 0));
        request.setArrivalSlotEnd(LocalDateTime.of(2026, 5, 20, 10, 0));
        request.setServiceIds(List.of(1L, 2L));
        request.setNote("Kiểm tra phanh");
        request.setPaymentMethod(PaymentMethod.CASH);

        Booking booking = new Booking();
        booking.setId(99L);
        bookingService.createBookingResult = booking;
        bookingService.mapToResponseResult = sampleResponse(99L);

        mockMvc.perform(post("/api/v1/bookings")
                        .principal(authentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.customerName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.totalAmount").value(350000));

        assertEquals("customer@example.com", bookingService.lastEmail);
        assertSame(request.getVehicleId(), bookingService.lastCreateRequest.getVehicleId());
    }

    @Test
    void getMyBookings_returnsCurrentUserBookings() throws Exception {
        bookingService.myBookingResponses = List.of(sampleResponse(1L), sampleResponse(2L));

        mockMvc.perform(get("/api/v1/bookings/me")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));

        assertEquals("customer@example.com", bookingService.lastEmail);
    }

    @Test
    void getBooking_returnsBookingDetails() throws Exception {
        bookingService.getBookingByIdResult = sampleResponse(7L);

        mockMvc.perform(get("/api/v1/bookings/7")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.licensePlate").value("59A1-12345"));

        assertEquals(7L, bookingService.lastBookingId);
        assertEquals("customer@example.com", bookingService.lastEmail);
    }

    @Test
    void updateBooking_returnsUpdatedBooking() throws Exception {
        UpdateBookingRequest request = new UpdateBookingRequest();
        request.setArrivalSlotStart(LocalDateTime.of(2026, 5, 21, 14, 0));
        request.setArrivalSlotEnd(LocalDateTime.of(2026, 5, 21, 15, 0));
        request.setServiceIds(List.of(3L));
        request.setNote("Đổi giờ hẹn");

        bookingService.updateBookingResult = sampleResponse(5L);

        mockMvc.perform(patch("/api/v1/bookings/5")
                        .principal(authentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("PENDING"));

        assertEquals(5L, bookingService.lastBookingId);
        assertEquals("customer@example.com", bookingService.lastEmail);
        assertEquals("Đổi giờ hẹn", bookingService.lastUpdateRequest.getNote());
    }

    @Test
    void cancelBooking_returnsCancelledBooking() throws Exception {
        BookingResponse cancelled = sampleResponse(8L);
        cancelled.setStatus(BookingStatus.CANCELLED);
        bookingService.getBookingByIdResult = cancelled;

        mockMvc.perform(patch("/api/v1/bookings/8/cancel")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(8L, bookingService.lastCancelledBookingId);
        assertEquals("customer@example.com", bookingService.lastEmail);
    }

    @Test
    void updateBooking_withTooLongNote_returnsBadRequest() throws Exception {
        UpdateBookingRequest request = new UpdateBookingRequest();
        request.setNote("a".repeat(1001));

        mockMvc.perform(patch("/api/v1/bookings/5")
                        .principal(authentication())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Ghi chú không được quá 1000 ký tự")));
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken(
                "customer@example.com",
                "password",
                AuthorityUtils.createAuthorityList("ROLE_CUSTOMER")
        );
    }

    private BookingResponse sampleResponse(Long id) {
        return BookingResponse.builder()
                .id(id)
                .status(BookingStatus.PENDING)
                .bookingTime(LocalDateTime.of(2026, 5, 20, 9, 0))
                .arrivalSlotStart(LocalDateTime.of(2026, 5, 20, 9, 0))
                .arrivalSlotEnd(LocalDateTime.of(2026, 5, 20, 10, 0))
                .arrivalTime(LocalDateTime.of(2026, 5, 20, 9, 15))
                .customerName("Nguyen Van A")
                .vehicleOwnerName("Nguyen Van A")
                .customerPhone("0901234567")
                .vehicleName("Honda SH")
                .licensePlate("59A1-12345")
                .branchName("Chi nhánh Quận 1")
                .mechanicName("Chưa có thợ")
                .serviceNames(List.of("Thay nhớt", "Kiểm tra phanh"))
                .partNames(List.of("Má phanh"))
                .totalAmount(BigDecimal.valueOf(350000))
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();
    }

    private static class StubBookingService extends BookingService {
        private String lastEmail;
        private Long lastBookingId;
        private Long lastCancelledBookingId;
        private BookingRequest lastCreateRequest;
        private UpdateBookingRequest lastUpdateRequest;
        private Booking createBookingResult;
        private BookingResponse mapToResponseResult;
        private BookingResponse getBookingByIdResult;
        private BookingResponse updateBookingResult;
        private List<BookingResponse> myBookingResponses;

        @Override
        public Booking createBooking(String currentUserEmail, BookingRequest request) {
            this.lastEmail = currentUserEmail;
            this.lastCreateRequest = request;
            return createBookingResult;
        }

        @Override
        public BookingResponse mapToResponse(Booking booking) {
            return mapToResponseResult;
        }

        @Override
        public List<BookingResponse> getMyBookingResponses(String email) {
            this.lastEmail = email;
            return myBookingResponses;
        }

        @Override
        public BookingResponse getBookingById(Long bookingId, String currentUserEmail) {
            this.lastBookingId = bookingId;
            this.lastEmail = currentUserEmail;
            return getBookingByIdResult;
        }

        @Override
        public BookingResponse updateBooking(Long bookingId, String currentUserEmail, UpdateBookingRequest request) {
            this.lastBookingId = bookingId;
            this.lastEmail = currentUserEmail;
            this.lastUpdateRequest = request;
            return updateBookingResult;
        }

    }
}
