package com.example.smartgarage.service;

import com.example.smartgarage.dto.*;
import com.example.smartgarage.entity.*;
import com.example.smartgarage.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.deepoove.poi.XWPFTemplate;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.deepoove.poi.XWPFTemplate;


import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;


import java.io.InputStream;

@Service
public class BookingService {
    @Autowired private UserRepository userRepository;
    @Autowired private MotorbikeRepository motorbikeRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private MechanicRepository mechanicRepository;
    @Autowired private EmailService emailService;
    @Transactional
    public Booking createBooking(String currentUserEmail, BookingRequest request) {
        // 1. Lấy User từ Email (đã xác thực qua JWT), không dùng ID từ Request để tránh giả mạo
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng đăng nhập"));

        // 2. Kiểm tra xe máy có thuộc quyền sở hữu của User này không (Bảo mật thêm)
        Motorbike motorbike = motorbikeRepository.findById(request.getMotorbikeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe máy"));
        if (!motorbike.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Xe máy này không thuộc sở hữu của bạn!");
        }
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi nhánh"));

        // 3. Tạo thực thể Booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setMotorbike(motorbike);
        booking.setBranch(branch);
        booking.setBookingTime(request.getBookingTime());
        booking.setNote(request.getNote());
        booking.setStatus("PENDING");

        // 4. Lấy danh sách dịch vụ và tính sơ bộ tổng tiền (nếu cần)
        List<com.example.smartgarage.entity.Service> services = serviceRepository.findAllById(request.getServiceIds());
        booking.setServices(services);

        return bookingRepository.save(booking);
    }

    // Lấy danh sách lịch hẹn của chính người đang đăng nhập
//    public List<Booking> getMyBookings(String email) {
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
//        return bookingRepository.findAllByUserIdOrderByBookingTimeDesc(user.getId());
//    }
    public List<BookingResponse> getAllBookings(String status) {
        List<Booking> bookings = bookingRepository.findAll(); // Lấy tất cả Entity từ DB
        // SỬ DỤNG HÀM MAPPER: Duyệt qua danh sách và biến mỗi Entity thành DTO
        return bookings.stream()
                .map(this::mapToResponse) // Gọi hàm mapToResponse cho từng phần tử
                .collect(Collectors.toList());
    }

    public BookingResponse mapToResponse(Booking booking) {
        // 1. Tính tổng tiền từ danh sách dịch vụ
        // Nếu danh sách null, mặc định tổng tiền là 0
        BigDecimal total = (booking.getServices() == null) ? BigDecimal.ZERO :
                booking.getServices().stream()
                        .map(com.example.smartgarage.entity.Service::getPrice)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        // 2. Map dữ liệu vào DTO
        return BookingResponse.builder()
                .id(booking.getId())
                .status(booking.getStatus())
                .bookingTime(booking.getBookingTime())
                .customerName(booking.getUser() != null ? booking.getUser().getFullName() : "Khách vãng lai")
                .customerPhone(booking.getUser() != null ? booking.getUser().getPhone() : "N/A")
                .bikeName(booking.getMotorbike() != null ?
                        booking.getMotorbike().getBrand() + " " + booking.getMotorbike().getModel() : "N/A")
                .licensePlate(booking.getMotorbike() != null ? booking.getMotorbike().getLicensePlate() : "N/A")
                .branchName(booking.getBranch() != null ? booking.getBranch().getName() : "N/A")
                .mechanicName(booking.getMechanic() != null ? booking.getMechanic().getFullName() : "Chưa có thợ")
                // Lấy danh sách tên dịch vụ
                .serviceNames(booking.getServices().stream()
                        .map(com.example.smartgarage.entity.Service::getName)
                        .collect(Collectors.toList()))
                .totalAmount(total)
                .build();
    }

    @Transactional
    public void cancelBooking(Long bookingId, String currentUserEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn"));
        // Chỉ cho phép chủ sở hữu lịch hẹn hoặc ADMIN hủy
        if (!booking.getUser().getEmail().equals(currentUserEmail)) {
            throw new RuntimeException(" bạn không có quyền hủy lịch hẹn của người khác!");
        }
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể hủy lịch hẹn đang ở trạng thái PENDING.");
        }
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }
    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long mechanicId) {
        // 1. Tìm và cập nhật Entity trong DB
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        Mechanic mechanic = mechanicRepository.findById(mechanicId).orElseThrow();

        booking.setMechanic(mechanic);
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        // 2. SỬ DỤNG HÀM MAPPER: Chuyển đổi Entity vừa lưu sang DTO
        return mapToResponse(booking);
    }

//    @Transactional
//    public Booking completeBooking(Long bookingId) {
//        Booking booking = bookingRepository.findById(bookingId)
//                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn"));
//        booking.setStatus("COMPLETED");
//
//        // Cách sửa đúng dùng cho BigDecimal
//        BigDecimal total = (booking.getServices() == null) ? BigDecimal.ZERO :
//                booking.getServices().stream()
//                        .map(com.example.smartgarage.entity.Service::getPrice)
//                        .reduce(BigDecimal.ZERO, BigDecimal::add);
//        // Bạn nên có cột totalAmount trong Entity Booking để lưu lại giá trị này
//        // booking.setTotalAmount(totalAmount);
//
//        if (booking.getMechanic() != null) {
//            booking.getMechanic().setStatus("ACTIVE"); // Giải phóng thợ
//        }
//        return bookingRepository.save(booking);
//    }

    public List<BookingHistoryDTO> getMyBookings(String email) {
        // Tìm User dựa trên email lấy từ token
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
        // Lấy danh sách booking của User đó
        List<Booking> bookings = bookingRepository.findAllByUserIdOrderByBookingTimeDesc(user.getId());

        return bookings.stream()
                .map(BookingHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public DashboardStatusDTO getDashboardStatus() {
        // 1. Đếm số lượng theo từng trạng thái
        long total = bookingRepository.count();
        long pending = bookingRepository.countByStatus("PENDING");
        long confirmed = bookingRepository.countByStatus("CONFIRMED");
        long completed = bookingRepository.countByStatus("COMPLETED");
        long cancelled = bookingRepository.countByStatus("CANCELLED");

        // 2. Tính tổng doanh thu
        BigDecimal revenue = bookingRepository.calculateTotalRevenue();
        if (revenue == null) revenue = BigDecimal.ZERO;

        // 3. Lấy Top 5 dịch vụ hay dùng nhất
        List<ServiceStatisticDTO> topServices = bookingRepository.findTopServices(PageRequest.of(0, 5));

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

    public byte[] exportBookingsToExcel() throws IOException {
        List<Booking> bookings = bookingRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sách lịch hẹn");

            // 1. Tạo Header (Dòng tiêu đề)
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Khách hàng","Số điê thoại", "Biển số", "Ngày hẹn", "Trạng thái", "Tổng tiền"};

            // Style cho Header (In đậm, nền xám)
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // 2. Đổ dữ liệu vào các dòng tiếp theo
            int rowIdx = 1;
            for (Booking booking : bookings) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(booking.getId());
                row.createCell(1).setCellValue(booking.getUser() != null ? booking.getUser().getFullName() : "N/A");
                row.createCell(2).setCellValue(booking.getUser() != null ? booking.getUser().getPhone() : "N/A");
                row.createCell(3).setCellValue(booking.getMotorbike() != null ? booking.getMotorbike().getLicensePlate() : "N/A");
                row.createCell(4).setCellValue(booking.getBookingTime().toString());
                row.createCell(5).setCellValue(booking.getStatus());

                // Tính tổng tiền (Sử dụng logic BigDecimal chúng ta đã sửa)
                double total = booking.getServices().stream().mapToDouble(s -> s.getPrice().doubleValue()).sum();
                row.createCell(5).setCellValue(total);
            }

            // Tự động căn chỉnh độ rộng cột
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
     private BookingResponse convertToResponse(Booking booking) {
        BookingResponse response = new BookingResponse();

        response.setId(booking.getId());
        response.setStatus(booking.getStatus());
        response.setBookingTime(booking.getBookingTime());

        // 1. Xử lý tên khách hàng (Lấy tên, nếu trống thì lấy Email như đã làm ở file Excel)
        if (booking.getUser() != null) {
            String name = (booking.getUser().getFullName() != null && !booking.getUser().getFullName().isEmpty())
                    ? booking.getUser().getFullName()
                    : booking.getUser().getEmail();
            response.setCustomerName(name);
        }

        // 2. Lấy thông tin thợ sửa (Nếu đã gán thợ)
        if (booking.getMechanic() != null) {
            response.setMechanicName(booking.getMechanic().getFullName());
        } else {
            response.setMechanicName("Chưa gán thợ");
        }

        // 3. Lấy biển số xe
        if (booking.getMotorbike() != null) {
            response.setLicensePlate(booking.getMotorbike().getLicensePlate());
        }

        // 4. Tính tổng tiền từ danh sách dịch vụ (Dùng BigDecimal để chính xác)
        BigDecimal total = BigDecimal.ZERO;
        if (booking.getServices() != null) {
            total = booking.getServices().stream()
                    .map(com.example.smartgarage.entity.Service::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        response.setTotalAmount(total);

        return response;
    }

    // Trong class BookingService
    @Transactional
    public BookingResponse completeBooking(Long id) {
        // 1. Tìm đơn hàng
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));

        if ("COMPLETED".equals(booking.getStatus()) || "CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Đơn hàng đã kết thúc, không thể thay đổi!");
        }

        // 2. Lấy biển số xe (Xử lý lỗi biến licensePlate ở đây)
        String licensePlate = (booking.getMotorbike() != null) ? booking.getMotorbike().getLicensePlate() : "N/A";

        // 3. Tính tổng tiền và định dạng số
        BigDecimal totalAmount = booking.getServices().stream()
                .map(com.example.smartgarage.entity.Service::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String formattedTotal = String.format("%,.0f", totalAmount);

        // 4. Cập nhật trạng thái
        booking.setStatus("COMPLETED");
        if (booking.getMechanic() != null) {
            booking.getMechanic().setStatus("AVAILABLE");
        }
        bookingRepository.save(booking);

        // 5. Gửi Email HTML (Sửa lỗi và tối ưu giao diện)
        if (booking.getUser() != null && booking.getUser().getEmail() != null) {
            String customerName = (booking.getUser().getFullName() != null) ? booking.getUser().getFullName() : "Quý khách";

            // Tạo danh sách dịch vụ dạng bảng HTML
            String serviceRows = booking.getServices().stream()
                    .map(s -> "<tr>" +
                            "<td style='padding: 10px; border-bottom: 1px solid #eee;'>" + s.getName() + "</td>" +
                            "<td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" + String.format("%,.0f", s.getPrice()) + " VNĐ</td>" +
                            "</tr>")
                    .collect(Collectors.joining());

            String htmlContent = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;'>" +
                    "<h2 style='color: #007bff; text-align: center;'>SMART GARAGE - HÓA ĐƠN</h2>" +
                    "<p>Chào <b>" + customerName + "</b>,</p>" +
                    "<p>Chúc mừng! Xe của bạn mang biển số <span style='color: #d9534f; font-weight: bold;'>" + licensePlate + "</span> đã được sửa chữa và bảo trì hoàn tất.</p>" +
                    "<table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>" +
                    "<thead style='background-color: #f8f9fa;'><tr><th style='padding: 10px; text-align: left;'>Dịch vụ</th><th style='padding: 10px; text-align: right;'>Giá</th></tr></thead>" +
                    "<tbody>" + serviceRows + "</tbody>" +
                    "</table>" +
                    "<div style='margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #d9534f;'>" +
                    "TỔNG CỘNG: " + formattedTotal + " VNĐ" +
                    "</div>" +
                    "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                    "<p style='font-size: 12px; color: #777; text-align: center;'>Đây là email tự động, vui lòng không phản hồi. Hẹn gặp lại bạn!</p>" +
                    "</div></body></html>";

            emailService.sendHtmlEmail(booking.getUser().getEmail(), "Hóa đơn hoàn tất sửa chữa - " + licensePlate, htmlContent);
        }

        return convertToResponse(booking);
    }

    public byte[] exportInvoiceWord(Long bookingId) throws IOException {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // 1. Chuẩn bị dữ liệu để điền vào template
        Map<String, Object> data = new HashMap<>();
        data.put("customerName", booking.getUser() != null ? booking.getUser().getFullName() : "Khách vãng lai");
        data.put("licensePlate", booking.getMotorbike() != null ? booking.getMotorbike().getLicensePlate() : "N/A");
        data.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Tính tổng tiền
        BigDecimal total = booking.getServices().stream()
                .map(com.example.smartgarage.entity.Service::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.put("totalPrice", total.toString() + " VNĐ");
        // 2. Đọc template và đổ dữ liệu
        Resource resource = new ClassPathResource("templates/invoice_template.docx");
        try (InputStream is = resource.getInputStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            XWPFTemplate template = XWPFTemplate.compile(is).render(data);
            template.write(out);
            template.close();
            return out.toByteArray();
        }
    }
}