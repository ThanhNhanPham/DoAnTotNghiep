# 🚗 Smart Garage System - Hệ thống quản lý garage thông minh
> Giải pháp quản lý Gara hiện đại tích hợp trí tuệ nhân tạo (LLM) giúp tối ưu quy trình đặt lịch và chẩn đoán lỗi xe.

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![React Native](https://img.shields.io/badge/React_Native-Expo-blue.svg)](https://reactnative.dev/)

1. TÍNH NĂNG CỐT LÕI<br>

🤖 AI Consultant (Gemini Integration): Chatbot thông minh giúp chẩn đoán lỗi xe dựa trên mô tả của người dùng, đưa ra lời khuyên kỹ thuật tức thì.

📅 Smart Booking: Hệ thống đặt lịch linh hoạt, tự động kiểm tra khung giờ trống của kỹ thuật viên.

📊 Management Dashboard: Quản lý kho phụ tùng, lịch sử sửa chữa và doanh thu thời gian thực (Backend xử lý).

📱 Cross-platform Mobile: Ứng dụng mượt mà trên cả iOS và Android thông qua Expo.

2. CÔNG NGHỆ SỬ DỤNG<BR>

Backend: Java 21, Spring Boot, Spring Security (JWT)

Frontend: ReactJs, React Native, Expo, Axios, Tailwind CSS (NativeWind)

Database: PostgreSQL

AI Engine: 	Google Gemini API (v3 Flash/Pro)

3. Kiến trúc hệ thống<br>

<pre>
[ Mobile App ] <----(REST API)----> [ Spring Boot Server ] <----(REST API)----> [ Admin Web ]
      ^                                     |                                     ^
      |                                     v                                     |
[ AI Gemini ]                        [ PostgreSQL DB ]                      [ Cloud Storage ]
</pre>

4. Hình ảnh giao diện<br>

   <table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/df5c3e48-7b13-4c0d-b9a6-50d99f8c9d1e" width="300" alt="Màn hình Mobile 1"/>
      <br>
      <em>Giao diện login/register</em>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/88d5b2aa-888a-4abe-b7b8-1642153e348a" width="300" alt="Màn hình Mobile 2"/>
      <br>
      <em>Trang chủ</em>
    </td>
  </tr>
</table>

<img width="1512" height="811" alt="Ảnh màn hình 2026-04-10 lúc 21 27 41" src="https://github.com/user-attachments/assets/4d31b364-0d8b-4f24-a38c-9537264c367b" />
<img width="1512" height="817" alt="Ảnh màn hình 2026-04-10 lúc 21 29 23" src="https://github.com/user-attachments/assets/851b878a-3921-4282-a70b-41c2b9b7cc22" />

5. 🤝 Liên hệ & Thông tin

| Thông tin | Chi tiết |
| :--- | :--- |
| **👤 Sinh viên** | **Phạm Thành Nhân** |
| **🎓 Đơn vị** | CNTT - University of Transport and Communications |
| **💻 GitHub** | [@ThanhNhanPham](https://github.com/ThanhNhanPham) |
| **📧 Email** | nhanpham.04122004@gmail.com |
| **🚀 Linked** | https://www.linkedin.com/in/ph%E1%BA%A1m-th%C3%A0nh-nh%C3%A2n-3353b3286/ |



