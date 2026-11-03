# Loading và chuyển trang

- Bỏ màn hình MFA tách riêng trong ảnh: email/mật khẩu luôn giữ trong form. Ô mã chỉ mở ngay dưới mật khẩu khi API trả mfaRequired; không bỏ xác thực bắt buộc của backend. Đổi tài khoản xóa mã/token thử thách khỏi trạng thái.
- Loading đầu tiên có ngay trong index.html, trước khi bundle React tải xong. React tiếp tục hiệu ứng logo, chờ kiểm tra phiên thật rồi fade-out. Thời gian giới thiệu tối thiểu 650ms chỉ lúc mở app, không áp dụng mỗi lần chuyển trang.
- Chuyển trang có thanh nhấn màu xanh/vàng và hiệu ứng nội dung 300ms. Thanh chuyển trang là hiệu ứng trang trí, không hiển thị phần trăm tải giả.
- Loading dữ liệu và lazy module dùng logo chuyển động, thanh indeterminate và skeleton. Chỉ kết thúc khi tác vụ thật hoàn tất/lỗi.
- Nút đăng nhập có spinner, khóa gửi trùng. Hỗ trợ prefers-reduced-motion và trình đọc màn hình.
- Giữ nguyên API thật, refresh token, phân quyền và dữ liệu nghiệp vụ.

## Kiểm tra bản cập nhật

Build production đạt. 23 bài kiểm thử HTTP, adapter API và mock regression đạt. Trình duyệt kiểm tra theo hợp đồng API: ADMIN 28 trang, INSTRUCTOR 15, STUDENT 20 và PARENT 20; không phát hiện lỗi JavaScript/endpoint mock-only trong các lượt đã hoàn tất. Các phản hồi API ở kiểm tra UI là fixture, không phải tài khoản thật.

Đã kiểm tra loading startup, gỡ lớp chặn sau loading, form MFA inline, viewport 390px không tràn ngang và chế độ giảm chuyển động. Không đóng gói ảnh chụp trình duyệt.

ZIP đầu vào có các nhánh/test cũ không còn thuộc ứng dụng hiện hành. Bản xuất giữ graph import của src/main.jsx cùng bộ test HTTP/live-adapter/workflows hiện hành để tránh lẫn các phiên bản.
