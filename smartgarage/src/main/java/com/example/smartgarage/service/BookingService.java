package com.example.smartgarage.service;

import com.example.smartgarage.dto.*;
import com.example.smartgarage.entity.*;
import com.example.smartgarage.exception.GlobalExceptionHandler;
import com.example.smartgarage.exception.ResourceNotFoundException;
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
    @Autowired private PartRepository partRepository;
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
        // 1. Tính tiền dịch vụ (Service)
        BigDecimal servicesTotal = (booking.getServices() == null) ? BigDecimal.ZERO :
                booking.getServices().stream()
                        .map(com.example.smartgarage.entity.Service::getPrice)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

    // 2. Tính tiền linh kiện (Part) - Nếu danh sách null hoặc trống thì mặc định là 0
        BigDecimal partsTotal = (booking.getParts() == null) ? BigDecimal.ZERO :
                booking.getParts().stream()
                        .map(Part::getPrice)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

    // 3. Tổng cộng cuối cùng
        BigDecimal finalTotal = servicesTotal.add(partsTotal);
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
                // Map danh sách tên Linh kiện (Phần mới thêm)
                .partNames(booking.getParts() != null ? booking.getParts().stream()
                        .map(Part::getName)
                        .collect(Collectors.toList()) : new java.util.ArrayList<>())
                .totalAmount(finalTotal)
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
        // 1. Tìm đơn hàng và Kiểm tra trạng thái
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + id));

        if ("COMPLETED".equals(booking.getStatus()) || "CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Đơn hàng đã kết thúc hoặc đã hủy!");
        }

        // 2. Trừ kho linh kiện (Inventory Management)
        if (booking.getParts() != null) {
            for (Part part : booking.getParts()) {
                if (part.getQuantity() < 1) {
                    throw new RuntimeException("Linh kiện '" + part.getName() + "' đã hết hàng!");
                }
                part.setQuantity(part.getQuantity() - 1);
                partRepository.save(part);
            }
        }

        // 3. Tính toán tổng tiền (Dịch vụ + Linh kiện)
        BigDecimal servicesTotal = booking.getServices().stream()
                .map(com.example.smartgarage.entity.Service::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal partsTotal = (booking.getParts() != null) ? booking.getParts().stream()
                .map(Part::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        BigDecimal finalTotal = servicesTotal.add(partsTotal);
        booking.setTotalAmount(finalTotal);

        // 4. Cập nhật trạng thái Booking và Giải phóng thợ
        booking.setStatus("COMPLETED");
        if (booking.getMechanic() != null) {
            booking.getMechanic().setStatus("AVAILABLE");
        }

        bookingRepository.save(booking);

        // 5. Gửi Email HTML (Sử dụng hàm bổ trợ đã viết ở bước trước)
        sendCompletionEmail(booking, finalTotal);
        // 6. Chuyển đổi sang BookingResponse (Sử dụng Builder)
        return mapToResponse(booking);
    }
    private void sendCompletionEmail(Booking booking, BigDecimal total) {
        if (booking.getUser() == null || booking.getUser().getEmail() == null) return;

        String licensePlate = (booking.getMotorbike() != null) ? booking.getMotorbike().getLicensePlate() : "N/A";
        String customerName = (booking.getUser().getFullName() != null) ? booking.getUser().getFullName() : "Quý khách";

        // Tạo các dòng cho Dịch vụ
        String serviceRows = booking.getServices().stream()
                .map(s -> String.format("<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Dịch vụ)</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>", s.getName(), s.getPrice()))
                .collect(Collectors.joining());

        // Tạo các dòng cho Linh kiện (Nếu có)
        String partRows = booking.getParts().stream()
                .map(p -> String.format("<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Linh kiện)</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>", p.getName(), p.getPrice()))
                .collect(Collectors.joining());

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
                "<tbody>" + serviceRows + partRows + "</tbody>" +
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
    @Transactional
    public void addPartToBooking(Long bookingId, Long partId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện"));

        // Kiểm tra xem linh kiện còn hàng không trước khi thêm vào đơn
        if (part.getQuantity() <= 0) {
            throw new RuntimeException("Linh kiện này đã hết hàng trong kho!");
        }
        // Thêm vào danh sách (Sự liên kết hình thành ở đây)
        booking.getParts().add(part);
        // Lưu lại đơn hàng (Hibernate sẽ tự thêm bản ghi vào bảng booking_parts)
        bookingRepository.save(booking);

    }
}