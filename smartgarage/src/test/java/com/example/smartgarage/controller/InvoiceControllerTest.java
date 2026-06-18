package com.example.smartgarage.controller;

import com.example.smartgarage.dto.InvoiceResponse;
import com.example.smartgarage.enums.MembershipTier;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.service.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InvoiceControllerTest {

    private MockMvc mockMvc;
    private StubInvoiceService invoiceService;

    @BeforeEach
    void setUp() {
        invoiceService = new StubInvoiceService();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new InvoiceController(invoiceService))
                .build();
    }

    @Test
    void getInvoiceById_returnsInvoiceJson() throws Exception {
        invoiceService.invoiceByIdResponse = sampleInvoiceResponse();

        mockMvc.perform(get("/api/v1/invoices/10")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceId").value(10))
                .andExpect(jsonPath("$.invoiceNumber").value("INV-1"))
                .andExpect(jsonPath("$.membershipTier").value("BRONZE"))
                .andExpect(jsonPath("$.finalAmount").value(650000));

        assertEquals(10L, invoiceService.lastInvoiceId);
        assertEquals("customer@example.com", invoiceService.lastEmail);
    }

    @Test
    void getInvoiceByBookingId_returnsInvoiceJson() throws Exception {
        invoiceService.invoiceByBookingResponse = sampleInvoiceResponse();

        mockMvc.perform(get("/api/v1/invoices/booking/25")
                        .principal(authentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(1))
                .andExpect(jsonPath("$.serviceAmount").value(500000))
                .andExpect(jsonPath("$.membershipDiscountAmount").value(50000));

        assertEquals(25L, invoiceService.lastBookingId);
        assertEquals("customer@example.com", invoiceService.lastEmail);
    }

    private UsernamePasswordAuthenticationToken authentication() {
        return new UsernamePasswordAuthenticationToken(
                "customer@example.com",
                "password",
                AuthorityUtils.createAuthorityList("ROLE_CUSTOMER")
        );
    }

    private InvoiceResponse sampleInvoiceResponse() {
        return InvoiceResponse.builder()
                .invoiceId(10L)
                .invoiceNumber("INV-1")
                .bookingId(1L)
                .customerName("Nguyen Van A")
                .customerPhone("0901234567")
                .licensePlate("59A1-12345")
                .serviceAmount(BigDecimal.valueOf(500000))
                .partAmount(BigDecimal.valueOf(200000))
                .membershipTier(MembershipTier.BRONZE)
                .membershipDiscountRate(new BigDecimal("0.10"))
                .membershipDiscountAmount(BigDecimal.valueOf(50000))
                .finalAmount(BigDecimal.valueOf(650000))
                .pointsEarned(2)
                .paymentMethod(PaymentMethod.CASH)
                .issuedAt(LocalDateTime.of(2026, 5, 22, 10, 30))
                .note("Thanh toán tiền mặt tại gara")
                .build();
    }

    private static class StubInvoiceService extends InvoiceService {
        private Long lastInvoiceId;
        private Long lastBookingId;
        private String lastEmail;
        private InvoiceResponse invoiceByIdResponse;
        private InvoiceResponse invoiceByBookingResponse;

        private StubInvoiceService() {
            super(null, null);
        }

        @Override
        public InvoiceResponse getInvoiceById(Long invoiceId, String currentUserEmail) {
            this.lastInvoiceId = invoiceId;
            this.lastEmail = currentUserEmail;
            return invoiceByIdResponse;
        }

        @Override
        public InvoiceResponse getInvoiceByBookingId(Long bookingId, String currentUserEmail) {
            this.lastBookingId = bookingId;
            this.lastEmail = currentUserEmail;
            return invoiceByBookingResponse;
        }
    }
}
