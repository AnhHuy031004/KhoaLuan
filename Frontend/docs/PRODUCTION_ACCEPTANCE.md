# Các hạng mục cần backend và nghiệm thu thật

Gói đầu vào chỉ có FE, live adapter và bộ xử lý mock. Các mục dưới đây không thể được xác nhận hoàn thành bằng cách sửa React hoặc localStorage. Không có máy chủ/DB/ngân hàng được triển khai hay thay đổi trong lần sửa này.

| Hạng mục trong báo cáo | Trạng thái bản bàn giao | Điều kiện cần hoàn tất |
| --- | --- | --- |
| Dữ liệu chung giữa nhiều máy | Chưa có trong demo | Backend và DB dùng chung; Admin và HLV trên hai máy đọc cùng một thay đổi |
| Mật khẩu/phiên/phân quyền thực | Live adapter có sẵn; demo vẫn có mật khẩu mẫu trong trình duyệt | Backend băm mật khẩu, kiểm tra quyền/phạm vi trên từng API, quản lý và thu hồi phiên |
| Khôi phục mật khẩu qua email | Demo thông báo rõ không gửi email | Backend cấp token một lần, hết hạn, chống dò tài khoản và giới hạn yêu cầu; gửi email thật |
| Duyệt/cấp đai/thanh toán đồng thời | Có kiểm thử nguyên tử trong mock; Web Locks chỉ cho cùng trình duyệt hỗ trợ | Transaction DB, unique constraint/idempotency/version và thử đồng thời từ hai máy |
| Lịch và lịch sử phân lớp | Sửa logic mock, giữ dữ liệu cũ | Backend thực thi kiểm tra chồng giờ và khoảng hiệu lực; đối chiếu dữ liệu cũ thiếu mốc ngày |
| Biểu phí/hóa đơn | Sửa logic mock và preview FE | Backend dùng cùng nguồn giá, khóa hóa đơn đã phát hành, lưu lý do và thẩm quyền override |
| Ngân hàng/cổng thanh toán | Mô phỏng, không chuyển tiền thật | Webhook có chữ ký/đối soát, số tiền/mã hóa đơn, retry, thanh toán thất bại và điều chỉnh sai sót |
| Audit | Có nhật ký hiệu chỉnh demo | Audit server bảo vệ khỏi sửa, before/after, người, đối tượng và lý do |
| Sao lưu | Có backup/restore JSON cho demo | Backup DB server theo lịch; diễn tập khôi phục, quy định lưu giữ/xóa dữ liệu |
| Mạng yếu/timeout sau khi ghi | HTTP client có timeout và thông báo | Backend idempotency key/kiểm tra trạng thái; không retry mù thao tác tài chính |
| Giám sát | Chưa triển khai dịch vụ giám sát | Log/metrics/error tracing, cảnh báo lỗi và quy trình hỗ trợ |
| Mobile/khả năng tiếp cận | Sửa CSS thẻ điểm danh/hóa đơn, nhãn/focus/dialog; có DOM test | Kiểm tra trình duyệt thật 360/390/430 px, zoom 200%, bàn phím, screen reader và tương phản |
| Hiệu năng vận hành | Có cache/coalescing/worker và benchmark giả | LCP/INP/CLS, p95 API, bộ nhớ điện thoại và tải đồng thời theo dữ liệu thực |

## Kiểm tra trước khi mở cho người dùng thật

1. Dùng `npm run build:live`, kiểm tra `VITE_USE_MOCK=false`, URL/proxy backend đúng môi trường; không đưa file `.env` chứa bí mật lên FE.
2. Kiểm tra hợp đồng API cho từng module và vai trò. Live adapter hiện dựa trên snapshot API cũ; xây được bundle không chứng minh endpoint thật đã hoạt động.
3. Chuyển các ràng buộc F01–F10 từ mock sang server, kiểm tra quyền qua ID và bộ lọc, kèm ca đồng thời.
4. Diễn tập backup/restore và đối soát thanh toán, kể cả request timeout sau khi server đã ghi.
5. Chạy nghiệm thu giao diện trên thiết bị thật. Kiểm thử DOM trong gói không có bộ máy layout nên không xác nhận tràn màn hình hay độ tương phản thực tế.

Một website giới thiệu công khai chỉ cần bổ sung khi dự án có yêu cầu nội dung Giới thiệu/CLB/Tuyển sinh/Liên hệ. Không công khai dữ liệu quản lý hoặc tự mở đăng ký nếu chưa có chính sách cấp tài khoản.
