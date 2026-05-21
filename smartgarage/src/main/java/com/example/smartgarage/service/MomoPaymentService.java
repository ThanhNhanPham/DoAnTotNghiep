package com.example.smartgarage.service;

import com.example.smartgarage.dto.MomoCreatePaymentResponse;
import com.example.smartgarage.dto.MomoIpnRequest;
import com.example.smartgarage.dto.PaymentStatusResponse;
import com.example.smartgarage.entity.Booking;
import com.example.smartgarage.entity.PaymentInvoice;
import com.example.smartgarage.entity.PaymentTransaction;
import com.example.smartgarage.enums.PaymentMethod;
import com.example.smartgarage.enums.PaymentProvider;
import com.example.smartgarage.enums.PaymentStatus;
import com.example.smartgarage.exception.ResourceNotFoundException;
import com.example.smartgarage.repository.BookingRepository;
import com.example.smartgarage.repository.PaymentInvoiceRepository;
import com.example.smartgarage.repository.PaymentTransactionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class MomoPaymentService {
    private static final String REQUEST_TYPE = "captureWallet";
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final BookingRepository bookingRepository;
    private final PaymentInvoiceRepository paymentInvoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${momo.partner-code:}")
    private String partnerCode;

    @Value("${momo.access-key:}")
    private String accessKey;

    @Value("${momo.secret-key:}")
    private String secretKey;

    @Value("${momo.create-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String createUrl;

    @Value("${momo.redirect-url:smartgarageapp://payment/momo}")
    private String redirectUrl;

    @Value("${momo.ipn-url:http://localhost:8080/api/v1/payments/momo/ipn}")
    private String ipnUrl;

    @Value("${momo.partner-name:SmartGarage}")
    private String partnerName;

    @Value("${momo.store-id:SmartGarage}")
    private String storeId;

    public MomoPaymentService(
            BookingRepository bookingRepository,
            PaymentInvoiceRepository paymentInvoiceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentInvoiceRepository = paymentInvoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MomoCreatePaymentResponse createPayment(Long bookingId, String currentUserEmail) {
        validateConfig();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException("Bạn không có quyền tạo thanh toán cho booking này.");
        }
        if (booking.getPaymentMethod() != PaymentMethod.MOMO) {
            throw new RuntimeException("Booking này không được cấu hình thanh toán qua MoMo.");
        }
        if (booking.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new RuntimeException("Booking này đã thanh toán thành công.");
        }
        if (booking.getTotalAmount() == null || booking.getTotalAmount().compareTo(BigDecimal.valueOf(1000)) < 0) {
            throw new RuntimeException("Số tiền thanh toán MoMo phải từ 1.000 VND trở lên.");
        }
        if (booking.getTotalAmount().compareTo(BigDecimal.valueOf(50_000_000L)) > 0) {
            throw new RuntimeException("Số tiền thanh toán MoMo không được vượt quá 50.000.000 VND.");
        }

        String requestId = "REQ_" + UUID.randomUUID().toString().replace("-", "");
        String orderId = "BOOKING_" + booking.getId() + "_" + System.currentTimeMillis();
        long amount = booking.getTotalAmount().longValue();
        String orderInfo = "Thanh toán booking #" + booking.getId() + " tai SmartGarage";
        String extraData = encodeExtraData(booking.getId());
        String signaturePayload = buildCreateSignaturePayload(amount, orderId, orderInfo, requestId, extraData);
        String signature = hmacSha256(signaturePayload, secretKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerCode", partnerCode);
        payload.put("partnerName", partnerName);
        payload.put("storeId", storeId);
        payload.put("requestId", requestId);
        payload.put("amount", amount);
        payload.put("orderId", orderId);
        payload.put("orderInfo", orderInfo);
        payload.put("redirectUrl", redirectUrl);
        payload.put("ipnUrl", ipnUrl);
        payload.put("lang", "vi");
        payload.put("requestType", REQUEST_TYPE);
        payload.put("autoCapture", true);
        payload.put("extraData", extraData);
        payload.put("signature", signature);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.MOMO)
                .status(PaymentStatus.PENDING)
                .amount(booking.getTotalAmount())
                .orderId(orderId)
                .requestId(requestId)
                .build();
        paymentTransactionRepository.save(transaction);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> response;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> momoResponse = restTemplate.postForObject(
                    createUrl,
                    new HttpEntity<>(payload, headers),
                    Map.class
            );
            response = momoResponse;
        } catch (Exception ex) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason("Không gọi được MoMo: " + ex.getMessage());
            booking.setPaymentStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(transaction);
            bookingRepository.save(booking);
            throw new RuntimeException("Không gọi được cổng thanh toán MoMo.", ex);
        }

        if (response == null) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason("MoMo không trả về dữ liệu.");
            booking.setPaymentStatus(PaymentStatus.FAILED);
            throw new RuntimeException("Không nhận được phản hồi từ MoMo.");
        }

        transaction.setRawResponse(toJson(response));
        Integer resultCode = parseInteger(response.get("resultCode"));
        String message = String.valueOf(response.getOrDefault("message", ""));
        transaction.setPayUrl(asText(response.get("payUrl")));
        transaction.setDeeplink(asText(response.get("deeplink")));
        transaction.setQrCodeUrl(asText(response.get("qrCodeUrl")));

        if (resultCode != null && resultCode == 0) {
            booking.setPaymentStatus(PaymentStatus.PENDING);
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason(message);
            booking.setPaymentStatus(PaymentStatus.FAILED);
        }

        paymentTransactionRepository.save(transaction);
        bookingRepository.save(booking);

        return MomoCreatePaymentResponse.builder()
                .bookingId(booking.getId())
                .orderId(orderId)
                .requestId(requestId)
                .resultCode(resultCode)
                .message(message)
                .payUrl(transaction.getPayUrl())
                .deeplink(transaction.getDeeplink())
                .qrCodeUrl(transaction.getQrCodeUrl())
                .paymentStatus(booking.getPaymentStatus())
                .build();
    }

    @Transactional
    public void handleIpn(MomoIpnRequest request) {
        validateConfig();

        Optional<PaymentTransaction> optionalTransaction = paymentTransactionRepository.findByOrderId(request.getOrderId());
        if (optionalTransaction.isEmpty()) {
            log.warn("Bỏ qua IPN MoMo vì không tim thấy orderId {}", request.getOrderId());
            return;
        }

        PaymentTransaction transaction = optionalTransaction.get();
        Booking booking = transaction.getBooking();

        String expectedSignature = hmacSha256(buildIpnSignaturePayload(request), secretKey);
        if (!expectedSignature.equals(request.getSignature())) {
            log.warn("IPN MoMo sai signature cho orderId {}", request.getOrderId());
            return;
        }
        if (!partnerCode.equals(request.getPartnerCode())) {
            log.warn("IPN MoMo sai partnerCode cho orderId {}", request.getOrderId());
            return;
        }
        if (request.getAmount() == null || transaction.getAmount().longValue() != request.getAmount()) {
            log.warn("IPN MoMo sai amount cho orderId {}", request.getOrderId());
            return;
        }

        transaction.setTransId(request.getTransId());
        transaction.setFailureReason(request.getMessage());
        transaction.setRawResponse(toJson(request));

        if (request.getResultCode() != null && request.getResultCode() == 0) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transaction.setPaidAt(LocalDateTime.now());
            booking.setPaymentStatus(PaymentStatus.SUCCESS);
            issueInvoice(booking, transaction, "Thanh toán thành công qua MoMo IPN");
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            booking.setPaymentStatus(PaymentStatus.FAILED);
        }

        paymentTransactionRepository.save(transaction);
        bookingRepository.save(booking);
    }

    @Transactional
    public PaymentStatusResponse mockConfirmPayment(Long bookingId, String currentUserEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException("Bạn không có quyền xác nhận thanh toán cho booking này.");
        }
        if (booking.getPaymentMethod() != PaymentMethod.MOMO) {
            throw new RuntimeException("Booking này không được cấu hình thanh toán qua MoMo.");
        }

        PaymentTransaction transaction = paymentTransactionRepository
                .findTopByBookingIdOrderByCreatedAtDesc(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking này chưa có giao dịch MoMo để xác nhận."));

        if (transaction.getProvider() != PaymentProvider.MOMO) {
            throw new RuntimeException("Giao dịch gần nhất của booking này không phải MoMo.");
        }
        if (transaction.getStatus() == PaymentStatus.SUCCESS && booking.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return buildPaymentStatusResponse(booking, Optional.of(transaction));
        }

        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setFailureReason("Mock confirm sandbox");
        transaction.setPaidAt(LocalDateTime.now());
        if (transaction.getTransId() == null) {
            transaction.setTransId(System.currentTimeMillis());
        }

        booking.setPaymentStatus(PaymentStatus.SUCCESS);
        issueInvoice(booking, transaction, "Mock confirm sandbox");

        paymentTransactionRepository.save(transaction);
        bookingRepository.save(booking);

        return buildPaymentStatusResponse(booking, Optional.of(transaction));
    }

    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Long bookingId, String currentUserEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking ID: " + bookingId));

        if (!booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException("Bạn không có quyền xem trạng thái thanh toán của booking này.");
        }

        Optional<PaymentTransaction> latestTransaction = paymentTransactionRepository
                .findTopByBookingIdOrderByCreatedAtDesc(bookingId);

        return buildPaymentStatusResponse(booking, latestTransaction);
    }

    private void validateConfig() {
        if (partnerCode.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new RuntimeException("Chưa cấu hình đủ thông tin MoMo trong application.properties.");
        }
    }

    private String encodeExtraData(Long bookingId) {
        String json = "{\"bookingId\":\"" + bookingId + "\"}";
        return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    private String buildCreateSignaturePayload(long amount, String orderId, String orderInfo, String requestId, String extraData) {
        return "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + REQUEST_TYPE;
    }

    private String buildIpnSignaturePayload(MomoIpnRequest request) {
        return "accessKey=" + accessKey
                + "&amount=" + request.getAmount()
                + "&extraData=" + nullToEmpty(request.getExtraData())
                + "&message=" + nullToEmpty(request.getMessage())
                + "&orderId=" + nullToEmpty(request.getOrderId())
                + "&orderInfo=" + nullToEmpty(request.getOrderInfo())
                + "&orderType=" + nullToEmpty(request.getOrderType())
                + "&partnerCode=" + nullToEmpty(request.getPartnerCode())
                + "&payType=" + nullToEmpty(request.getPayType())
                + "&requestId=" + nullToEmpty(request.getRequestId())
                + "&responseTime=" + request.getResponseTime()
                + "&resultCode=" + request.getResultCode()
                + "&transId=" + request.getTransId();
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo chữ ký MoMo.", e);
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return String.valueOf(value);
        }
    }

    private Integer parseInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private String asText(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private PaymentStatusResponse buildPaymentStatusResponse(Booking booking, Optional<PaymentTransaction> transaction) {
        return PaymentStatusResponse.builder()
                .bookingId(booking.getId())
                .paymentMethod(booking.getPaymentMethod())
                .paymentStatus(booking.getPaymentStatus())
                .provider(transaction.map(PaymentTransaction::getProvider).orElse(null))
                .amount(booking.getTotalAmount())
                .orderId(transaction.map(PaymentTransaction::getOrderId).orElse(null))
                .requestId(transaction.map(PaymentTransaction::getRequestId).orElse(null))
                .transId(transaction.map(PaymentTransaction::getTransId).orElse(null))
                .payUrl(transaction.map(PaymentTransaction::getPayUrl).orElse(null))
                .deeplink(transaction.map(PaymentTransaction::getDeeplink).orElse(null))
                .qrCodeUrl(transaction.map(PaymentTransaction::getQrCodeUrl).orElse(null))
                .failureReason(transaction.map(PaymentTransaction::getFailureReason).orElse(null))
                .build();
    }

    private void issueInvoice(Booking booking, PaymentTransaction transaction, String note) {
        PaymentInvoice invoice = paymentInvoiceRepository.findByBookingId(booking.getId())
                .orElseGet(() -> PaymentInvoice.builder()
                        .invoiceNumber(generateInvoiceNumber(booking.getId()))
                        .booking(booking)
                        .build());

        invoice.setPaymentTransaction(transaction);
        invoice.setAmount(transaction.getAmount());
        invoice.setPaymentMethod(booking.getPaymentMethod());
        invoice.setPaymentProvider(transaction.getProvider());
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setNote(note);

        paymentInvoiceRepository.save(invoice);
    }

    private String generateInvoiceNumber(Long bookingId) {
        return "INV-" + bookingId + "-" + System.currentTimeMillis();
    }
}
