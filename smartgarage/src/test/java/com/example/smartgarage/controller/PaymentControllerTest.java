package com.example.smartgarage.controller;

import com.example.smartgarage.dto.PaymentStatusResponse;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaymentControllerTest {

    private MockMvc mockMvc;
    private StubPaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new StubPaymentService();
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PaymentController(paymentService))
                .build();
    }

    @Test
    void confirmCashPayment_returnsPaymentStatus() throws Exception {
        paymentService.confirmCashPaymentResponse = PaymentStatusResponse.builder()
                .bookingId(12L)
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.SUCCESS)
                .amount(BigDecimal.valueOf(650000))
                .build();

        mockMvc.perform(post("/api/v1/payments/cash/confirm/12")
                        .principal(adminAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(12))
                .andExpect(jsonPath("$.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"));

        assertEquals(12L, paymentService.lastCashBookingId);
    }

    @Test
    void confirmBankTransferPayment_returnsPaymentStatus() throws Exception {
        paymentService.confirmBankTransferPaymentResponse = PaymentStatusResponse.builder()
                .bookingId(20L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentStatus(PaymentStatus.SUCCESS)
                .amount(BigDecimal.valueOf(820000))
                .build();

        mockMvc.perform(post("/api/v1/payments/bank-transfer/confirm/20")
                        .principal(adminAuthentication()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(20))
                .andExpect(jsonPath("$.paymentMethod").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"));

        assertEquals(20L, paymentService.lastBankTransferBookingId);
    }

    private UsernamePasswordAuthenticationToken adminAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "admin@example.com",
                "password",
                AuthorityUtils.createAuthorityList("ROLE_ADMIN")
        );
    }

    private static class StubPaymentService extends PaymentService {
        private Long lastCashBookingId;
        private Long lastBankTransferBookingId;
        private PaymentStatusResponse confirmCashPaymentResponse;
        private PaymentStatusResponse confirmBankTransferPaymentResponse;

        private StubPaymentService() {
            super(null, null, null);
        }

        @Override
        public PaymentStatusResponse confirmCashPayment(Long bookingId) {
            this.lastCashBookingId = bookingId;
            return confirmCashPaymentResponse;
        }

        @Override
        public PaymentStatusResponse confirmBankTransferPayment(Long bookingId) {
            this.lastBankTransferBookingId = bookingId;
            return confirmBankTransferPaymentResponse;
        }
    }
}
