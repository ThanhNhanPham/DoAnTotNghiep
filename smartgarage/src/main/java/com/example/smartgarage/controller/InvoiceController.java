package com.example.smartgarage.controller;

import com.example.smartgarage.dto.InvoiceResponse;
import com.example.smartgarage.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Invoice API", description = "Quản lý hóa đơn")
@RestController
@RequestMapping("/api/v1/invoices")
@CrossOrigin("*")
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'SUPERADMIN')")
public class InvoiceController {
    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @Operation(summary="Lấy danh sách tất cả hóa đơn của khách hàng")
    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices(@RequestParam(required = false) String status,
                                                                Authentication authentication,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        String userName  = authentication.getName();
        List<InvoiceResponse> invoices = invoiceService.getInvoicesForCurrentUser(status,userName, page, size);
        return ResponseEntity.ok(invoices);
    }

    @Operation(summary = "Lấy chi tiết hóa đơn theo ID")
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id, authentication.getName()));
    }

    @Operation(summary = "Lấy hóa đơn theo booking ID")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<InvoiceResponse> getInvoiceByBookingId(@PathVariable Long bookingId, Authentication authentication) {
        return ResponseEntity.ok(invoiceService.getInvoiceByBookingId(bookingId, authentication.getName()));
    }

    @Operation(summary="Xoá hoá đơn theo ID")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?>  deleteInvoice(@PathVariable Long id){
        invoiceService.deleteInvoice(id);
        return ResponseEntity.ok(Map.of("message","Hoá đơn đã được xoá thành công"));
    }
}
