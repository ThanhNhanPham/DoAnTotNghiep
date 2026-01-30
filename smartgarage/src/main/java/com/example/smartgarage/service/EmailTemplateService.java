package com.example.smartgarage.service;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {
    public String buildAdminReplyEmail(String customerName,String reviewComment,String adminReply){
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;'>" +
                "  <div style='background-color: #2c3e50; color: white; padding: 20px; text-align: center;'>" +
                "    <h2>SMART GARAGE</h2>" +
                "    <p>Phản hồi mới về đánh giá của bạn</p>" +
                "  </div>" +
                "  <div style='padding: 20px; line-height: 1.6; color: #333;'>" +
                "    <p>Chào <b>" + customerName + "</b>,</p>" +
                "    <p>Cảm ơn bạn đã để lại đánh giá tại gara. Chúng tôi đã ghi nhận và có phản hồi mới dành cho bạn:</p>" +
                "    <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;'>" +
                "      <p style='margin: 0; font-style: italic;'>\"" + reviewComment + "\"</p>" +
                "    </div>" +
                "    <p><b>Phản hồi từ Gara:</b></p>" +
                "    <p style='background-color: #e8f4fd; padding: 15px; border-radius: 5px; color: #2c3e50;'>" + adminReply + "</p>" +
                "    <p>Chúc bạn có những hành trình an toàn!</p>" +
                "  </div>" +
                "  <div style='background-color: #eee; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                "    Đây là email tự động, vui lòng không trả lời email này." +
                "  </div>" +
                "</div>";
    }
    public String buildAdminAlertEmail(Long bookingId, int rating, String comment){
        String color = (rating == 1) ? "#e74c3c" : "#f39c12"; // Đỏ cho 1 sao, cam cho 2 sao
        return "<div style='font-family: Arial, sans-serif; border: 2px solid " + color + "; padding: 20px; border-radius: 10px;'>" +
                "  <h2 style='color: " + color + ";'>⚠️ CẢNH BÁO ĐÁNH GIÁ THẤP</h2>" +
                "  <p>Hệ thống vừa ghi nhận một đánh giá <b>" + rating + " sao</b> cho đơn hàng <b>#" + bookingId + "</b>.</p>" +
                "  <hr/>" +
                "  <p><b>Nội dung khách hàng viết:</b></p>" +
                "  <p style='background-color: #fff3f3; padding: 15px; border: 1px dashed #e74c3c;'>" + comment + "</p>" +
                "  <p><a href='http://localhost:8080/admin/dashboard' style='background-color: " + color + "; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Kiểm tra ngay trên Dashboard</a></p>" +
                "</div>";
    }
    public String buildMaintenanceReminderEmail(String customerName, String carModel) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;'>" +
                "  <div style='background-color: #f39c12; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;'>" +
                "    <h2>ĐÃ ĐẾN LÚC BẢO DƯỠNG XE!</h2>" +
                "  </div>" +
                "  <div style='padding: 20px; line-height: 1.6; color: #333;'>" +
                "    <p>Chào <b>" + customerName + "</b>,</p>" +
                "    <p>Đã <b>6 tháng</b> kể từ lần cuối bạn bảo dưỡng xe tại Smart Garage.</p>" +
                "    <p>Để đảm bảo chiếc xe <b>" + carModel + "</b> luôn vận hành êm ái và an toàn, chúng tôi khuyên bạn nên đưa xe đến gara để kiểm tra định kỳ các hạng mục:</p>" +
                "    <ul>" +
                "      <li>Thay dầu nhớt & lọc nhớt</li>" +
                "      <li>Kiểm tra hệ thống phanh</li>" +
                "      <li>Kiểm tra nước làm mát & lốp xe</li>" +
                "    </ul>" +
                "    <p><a href='http://localhost:3000/booking' style='background-color: #f39c12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Đặt lịch ngay bây giờ</a></p>" +
                "    <p>Hẹn gặp lại bạn tại Gara!</p>" +
                "  </div>" +
                "</div>";
    }
}
