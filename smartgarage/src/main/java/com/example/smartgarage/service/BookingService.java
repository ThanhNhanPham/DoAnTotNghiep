package com.example.smartgarage.service;

import com.example.smartgarage.dto.*;
import com.example.smartgarage.entity.*;
import com.example.smartgarage.enums.BookingStatus;
import com.example.smartgarage.enums.MechanicStatus;
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
        booking.setStatus(BookingStatus.PENDING);

        // 4. Lấy danh sách dịch vụ và tính sơ bộ tổng tiền (nếu cần)
        List<com.example.smartgarage.entity.Service> selectedServices = serviceRepository.findAllById(request.getServiceIds());
        // chuyển đổi sang BookedService
        List<BookedService> bookedServices = selectedServices.stream().map(s -> {
            return BookedService.builder()
                    .booking(booking)
                    .service(s)
                    .priceAtBooking(s.getPrice()) // Lưu giá tại thời điểm này
                    .build();
        }).collect(Collectors.toList());
        booking.setBookedServices(bookedServices);
        BigDecimal total = selectedServices.stream()
                .map(com.example.smartgarage.entity.Service::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setTotalAmount(total);

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
        BigDecimal servicesTotal = (booking.getBookedServices() == null) ? BigDecimal.ZERO :
                booking.getBookedServices().stream()
                        .map(BookedService::getPriceAtBooking)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

    // 2. Tính tiền linh kiện (Part) - Nếu danh sách null hoặc trống thì mặc định là 0
        BigDecimal partsTotal = (booking.getBookedPart() == null) ? BigDecimal.ZERO :
                booking.getBookedPart().stream()
                        .map(bp -> {
                            BigDecimal price = bp.getPriceAtBooking() != null ? bp.getPriceAtBooking() : BigDecimal.ZERO;
                            BigDecimal qty = new BigDecimal(bp.getQuantity() != null ? bp.getQuantity() : 0);
                            return price.multiply(qty);
                        })
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
                .serviceNames(booking.getBookedServices().stream()
                        .map(bs -> bs.getService().getName())
                        .collect(Collectors.toList()))
                // Map danh sách tên Linh kiện (Phần mới thêm)
                .partNames(booking.getBookedPart() != null ? booking.getBookedPart().stream()
                        .map(bp -> bp.getPart().getName())
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
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Chỉ có thể hủy lịch hẹn đang ở trạng thái PENDING.");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }
    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long mechanicId) {
        // 1. Tìm đơn hàng (Booking)
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + bookingId));

        // Kiểm tra nếu đơn hàng đã được xác nhận hoặc đã hoàn thành trước đó
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Đơn hàng này không ở trạng thái chờ (PENDING) để xác nhận.");
        }

        // 2. Tìm Thợ sửa xe (Mechanic)
        Mechanic mechanic = mechanicRepository.findById(mechanicId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thợ ID: " + mechanicId));

        // 3. KIỂM TRA TRẠNG THÁI THỢ (Tối ưu quan trọng)
        // Giả sử trạng thái sẵn sàng của bạn là "AVAILABLE" hoặc "ACTIVE"
        if (mechanic.getStatus() != MechanicStatus.ACTIVE) {
            throw new RuntimeException("Thợ " + mechanic.getFullName() + " hiện đang bận hoặc không sẵn sàng làm việc!");
        }

        // 4. CẬP NHẬT TRẠNG THÁI
        // Gán thợ cho đơn hàng
        booking.setMechanic(mechanic);
        booking.setStatus(BookingStatus.CONFIRMED);

        // Chuyển trạng thái thợ sang "BUSY" để các Admin khác không gán thợ này vào đơn khác
        mechanic.setStatus(MechanicStatus.BUSY);

        // 5. LƯU THAY ĐỔI
        bookingRepository.save(booking);
        mechanicRepository.save(mechanic); // Cần lưu lại trạng thái mới của thợ

        // 6. TRẢ VỀ DTO (Sử dụng hàm mapper bạn đã viết)
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
        long pending = bookingRepository.countByStatus(BookingStatus.PENDING);
        long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long completed = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);

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

    public byte[] exportBookingsToExcel() throws IOException {
        List<Booking> bookings = bookingRepository.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sách lịch hẹn");
            // 1. Tạo Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.createDataFormat().getFormat("dd/MM/yyyy HH:mm"));

            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0")); // Định dạng phân cách hàng nghìn

            // 1. Tạo Header (Dòng tiêu đề)
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Khách hàng","Số điện thoại", "Biển số", "Ngày hẹn", "Trạng thái", "Tổng tiền"};

            // Style cho Header (In đậm, nền xám)
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
                Cell dateCell = row.createCell(4);
                if (booking.getBookingTime() != null) {
                    dateCell.setCellValue(java.sql.Timestamp.valueOf(booking.getBookingTime()));
                    dateCell.setCellStyle(dateStyle);
                }
                row.createCell(5).setCellValue(booking.getStatus().toString());

                // Cột Tổng tiền (Lấy từ field totalAmount đã tính sẵn hoặc tính lại bằng BigDecimal)
                Cell totalCell = row.createCell(6);
                BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
                totalCell.setCellValue(total.doubleValue()); // POI nhận double nhưng Style sẽ định dạng lại
                totalCell.setCellStyle(moneyStyle);
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
        if (booking.getBookedServices() != null) {
            total = booking.getBookedServices().stream()
                    .map(BookedService::getPriceAtBooking)
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

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Đơn hàng đã kết thúc hoặc đã hủy từ trước!");
        }

        // 2. Trừ kho linh kiện (Inventory Management)
        if (booking.getBookedPart() != null) {
            for (BookedPart bookedPart : booking.getBookedPart()) {
                Part catalogPart = bookedPart.getPart();
                int quantityUsed = bookedPart.getQuantity();
                if(catalogPart.getQuantity() < quantityUsed) {
                    throw new RuntimeException("Linh kiện '" + catalogPart.getName() + "' không đủ số lượng trong kho!");
                }
                catalogPart.setQuantity(catalogPart.getQuantity() - quantityUsed);
                partRepository.save(catalogPart);
            }
        }
        // 3. Tính toán tổng tiền (Dịch vụ + Linh kiện)
        BigDecimal servicesTotal = booking.getBookedServices().stream()
                .map(BookedService::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal partsTotal = (booking.getBookedPart() != null) ? booking.getBookedPart().stream()
                .map(BookedPart::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        BigDecimal finalTotal = servicesTotal.add(partsTotal);
        booking.setTotalAmount(finalTotal);

        // 4. Cập nhật trạng thái Booking và Giải phóng thợ
        booking.setStatus(BookingStatus.COMPLETED);
        if (booking.getMechanic() != null) {
            booking.getMechanic().setStatus(MechanicStatus.ACTIVE);
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
        String serviceRows = booking.getBookedServices().stream()
                .map(s -> String.format("<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Dịch vụ)</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>", s.getService().getName(), s.getPriceAtBooking()))
                .collect(Collectors.joining());

        // Tạo các dòng cho Linh kiện (Nếu có)
        String partRows = booking.getBookedPart().stream()
                .map(p -> String.format("<tr><td style='padding:8px; border-bottom:1px solid #eee;'>%s (Linh kiện)</td><td style='text-align:right;'>%,.0f VNĐ</td></tr>", p.getPart().getName(), p.getPriceAtBooking()))
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
        BigDecimal total = booking.getBookedServices().stream()
                .map(BookedService::getPriceAtBooking)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.put("totalPrice", total + " VNĐ");
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
    public void addPartToBooking(Long bookingId, Long partId, int quantity) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        Part catalogPart = partRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy linh kiện"));
        // 3. Kiểm tra tồn kho
        if (catalogPart.getQuantity() < quantity) {
            throw new RuntimeException("Kho chỉ còn " + catalogPart.getQuantity() + " sản phẩm, không đủ để thêm!");
        }
        //4. KIẾN TẠO MỐI LIÊN KẾT (Tạo đối tượng trung gian BookedPart)
        // Chúng ta không dùng cái cũ, mà tạo cái mới để "snapshot" dữ liệu
        BookedPart bookedPart = new BookedPart();
        bookedPart.setBooking(booking);
        bookedPart.setPart(catalogPart);
        bookedPart.setQuantity(quantity);
        bookedPart.setPriceAtBooking(catalogPart.getPrice());
        // Thêm vào danh sách (Sự liên kết hình thành ở đây)
        // 5. Cập nhật danh sách trong Booking
        booking.getBookedPart().add(bookedPart);

        // 6. TRỪ KHO (Logic quan trọng của Smart Garage)
        catalogPart.setQuantity(catalogPart.getQuantity() - quantity);
        // 7. Cập nhật lại tổng tiền của đơn hàng
        BigDecimal currentTotal = (booking.getTotalAmount() != null) ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal additionalCost = catalogPart.getPrice().multiply(new BigDecimal(quantity));

        booking.setTotalAmount(currentTotal.add(additionalCost));
        partRepository.save(catalogPart); // Lưu lại số lượng kho mới
        bookingRepository.save(booking);
    }
}