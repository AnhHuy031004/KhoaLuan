# Bản đồ API cho BE

Nguồn chuẩn: `contracts/openapi.json`. Các đường dẫn dưới đây tính từ base URL, ID đều là chuỗi. Quyền còn phụ thuộc đơn vị và trạng thái bản ghi; bảng vai trò không thay thế kiểm tra quyền trên BE.

| Method | Path | Chức năng | Vai trò |
| --- | --- | --- | --- |
| GET | `/wards` | Danh sách · Quản lý phường | ADMIN, MASTER |
| GET | `/wards/{id}` | Chi tiết · Quản lý phường | ADMIN, MASTER |
| POST | `/wards` | Tạo · Quản lý phường | ADMIN, MASTER |
| PATCH | `/wards/{id}` | Sửa · Quản lý phường | ADMIN, MASTER |
| DELETE | `/wards/{id}` | Xóa · Quản lý phường | ADMIN, MASTER |
| GET | `/clubs` | Danh sách · Quản lý câu lạc bộ | ADMIN, MASTER |
| GET | `/clubs/{id}` | Chi tiết · Quản lý câu lạc bộ | ADMIN, MASTER |
| POST | `/clubs` | Tạo · Quản lý câu lạc bộ | ADMIN, MASTER |
| PATCH | `/clubs/{id}` | Sửa · Quản lý câu lạc bộ | ADMIN, MASTER |
| DELETE | `/clubs/{id}` | Xóa · Quản lý câu lạc bộ | ADMIN, MASTER |
| GET | `/users` | Danh sách · Tài khoản người dùng | ADMIN |
| GET | `/users/{id}` | Chi tiết · Tài khoản người dùng | ADMIN |
| POST | `/users` | Tạo · Tài khoản người dùng | ADMIN |
| PATCH | `/users/{id}` | Sửa · Tài khoản người dùng | ADMIN |
| DELETE | `/users/{id}` | Xóa · Tài khoản người dùng | ADMIN |
| GET | `/roles` | Danh sách · Vai trò & phân quyền | ADMIN |
| GET | `/roles/{id}` | Chi tiết · Vai trò & phân quyền | ADMIN |
| POST | `/roles` | Tạo · Vai trò & phân quyền | ADMIN |
| PATCH | `/roles/{id}` | Sửa · Vai trò & phân quyền | ADMIN |
| DELETE | `/roles/{id}` | Xóa · Vai trò & phân quyền | ADMIN |
| GET | `/students` | Danh sách · Hồ sơ võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/students/{id}` | Chi tiết · Hồ sơ võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/students` | Tạo · Hồ sơ võ sinh | ADMIN, MASTER |
| PATCH | `/students/{id}` | Sửa · Hồ sơ võ sinh | ADMIN, MASTER, STUDENT |
| DELETE | `/students/{id}` | Xóa · Hồ sơ võ sinh | ADMIN |
| GET | `/masters` | Danh sách · Đội ngũ võ sư | ADMIN, MASTER |
| GET | `/masters/{id}` | Chi tiết · Đội ngũ võ sư | ADMIN, MASTER |
| POST | `/masters` | Tạo · Đội ngũ võ sư | ADMIN |
| PATCH | `/masters/{id}` | Sửa · Đội ngũ võ sư | ADMIN |
| DELETE | `/masters/{id}` | Xóa · Đội ngũ võ sư | ADMIN |
| GET | `/instructors` | Danh sách · Huấn luyện viên | ADMIN, MASTER |
| GET | `/instructors/{id}` | Chi tiết · Huấn luyện viên | ADMIN, MASTER |
| POST | `/instructors` | Tạo · Huấn luyện viên | ADMIN, MASTER |
| PATCH | `/instructors/{id}` | Sửa · Huấn luyện viên | ADMIN, MASTER |
| DELETE | `/instructors/{id}` | Xóa · Huấn luyện viên | ADMIN |
| GET | `/classes` | Danh sách · Quản lý lớp học | ADMIN, MASTER, INSTRUCTOR |
| GET | `/classes/{id}` | Chi tiết · Quản lý lớp học | ADMIN, MASTER, INSTRUCTOR |
| POST | `/classes` | Tạo · Quản lý lớp học | ADMIN, MASTER |
| PATCH | `/classes/{id}` | Sửa · Quản lý lớp học | ADMIN, MASTER |
| DELETE | `/classes/{id}` | Xóa · Quản lý lớp học | ADMIN |
| GET | `/enrollments` | Danh sách · Phân lớp võ sinh | ADMIN, MASTER, INSTRUCTOR |
| GET | `/enrollments/{id}` | Chi tiết · Phân lớp võ sinh | ADMIN, MASTER, INSTRUCTOR |
| POST | `/enrollments` | Tạo · Phân lớp võ sinh | ADMIN, MASTER |
| PATCH | `/enrollments/{id}` | Sửa · Phân lớp võ sinh | ADMIN, MASTER |
| DELETE | `/enrollments/{id}` | Xóa · Phân lớp võ sinh | ADMIN |
| GET | `/schedules` | Danh sách · Lịch tập | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/schedules/{id}` | Chi tiết · Lịch tập | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/schedules` | Tạo · Lịch tập | ADMIN, MASTER, INSTRUCTOR |
| PATCH | `/schedules/{id}` | Sửa · Lịch tập | ADMIN, MASTER, INSTRUCTOR |
| DELETE | `/schedules/{id}` | Xóa · Lịch tập | ADMIN |
| GET | `/attendance` | Danh sách · Điểm danh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/attendance/{id}` | Chi tiết · Điểm danh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/leaves` | Danh sách · Đơn xin nghỉ | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/leaves/{id}` | Chi tiết · Đơn xin nghỉ | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/leaves` | Tạo · Đơn xin nghỉ | ADMIN, STUDENT |
| PATCH | `/leaves/{id}` | Sửa · Đơn xin nghỉ | ADMIN, MASTER |
| DELETE | `/leaves/{id}` | Xóa · Đơn xin nghỉ | ADMIN, MASTER |
| POST | `/leaves/{id}/actions/approve` | approve · Đơn xin nghỉ | ADMIN, MASTER, INSTRUCTOR |
| POST | `/leaves/{id}/actions/reject` | reject · Đơn xin nghỉ | ADMIN, MASTER, INSTRUCTOR |
| GET | `/evaluations` | Danh sách · Đánh giá võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/evaluations/{id}` | Chi tiết · Đánh giá võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/evaluations` | Tạo · Đánh giá võ sinh | ADMIN, MASTER, INSTRUCTOR |
| PATCH | `/evaluations/{id}` | Sửa · Đánh giá võ sinh | ADMIN, MASTER, INSTRUCTOR |
| DELETE | `/evaluations/{id}` | Xóa · Đánh giá võ sinh | ADMIN |
| GET | `/belt-ranks` | Danh sách · Danh mục cấp đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/belt-ranks/{id}` | Chi tiết · Danh mục cấp đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/belt-ranks` | Tạo · Danh mục cấp đai | ADMIN, MASTER |
| PATCH | `/belt-ranks/{id}` | Sửa · Danh mục cấp đai | ADMIN, MASTER |
| DELETE | `/belt-ranks/{id}` | Xóa · Danh mục cấp đai | ADMIN |
| GET | `/promotions` | Danh sách · Đề xuất thi lên đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/promotions/{id}` | Chi tiết · Đề xuất thi lên đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/promotions` | Tạo · Đề xuất thi lên đai | ADMIN, MASTER, INSTRUCTOR |
| PATCH | `/promotions/{id}` | Sửa · Đề xuất thi lên đai | ADMIN, MASTER |
| DELETE | `/promotions/{id}` | Xóa · Đề xuất thi lên đai | ADMIN |
| POST | `/promotions/{id}/actions/approve` | approve · Đề xuất thi lên đai | ADMIN, MASTER |
| POST | `/promotions/{id}/actions/reject` | reject · Đề xuất thi lên đai | ADMIN, MASTER |
| GET | `/belt-exams` | Danh sách · Kỳ thi thăng đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/belt-exams/{id}` | Chi tiết · Kỳ thi thăng đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/belt-exams` | Tạo · Kỳ thi thăng đai | ADMIN, MASTER |
| PATCH | `/belt-exams/{id}` | Sửa · Kỳ thi thăng đai | ADMIN, MASTER |
| DELETE | `/belt-exams/{id}` | Xóa · Kỳ thi thăng đai | ADMIN |
| POST | `/belt-exams/{id}/actions/approve` | approve · Kỳ thi thăng đai | ADMIN, MASTER |
| POST | `/belt-exams/{id}/actions/reject` | reject · Kỳ thi thăng đai | ADMIN, MASTER |
| GET | `/exam-results` | Danh sách · Kết quả thi | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/exam-results/{id}` | Chi tiết · Kết quả thi | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/exam-results` | Tạo · Kết quả thi | ADMIN, MASTER |
| PATCH | `/exam-results/{id}` | Sửa · Kết quả thi | ADMIN, MASTER |
| DELETE | `/exam-results/{id}` | Xóa · Kết quả thi | ADMIN |
| POST | `/exam-results/{id}/actions/approve` | approve · Kết quả thi | ADMIN |
| POST | `/exam-results/{id}/actions/reject` | reject · Kết quả thi | ADMIN |
| GET | `/belt-history` | Danh sách · Lịch sử cấp đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/belt-history/{id}` | Chi tiết · Lịch sử cấp đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/tuition` | Danh sách · Quản lý học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/tuition/{id}` | Chi tiết · Quản lý học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/tuition` | Tạo · Quản lý học phí | ADMIN |
| PATCH | `/tuition/{id}` | Sửa · Quản lý học phí | ADMIN |
| DELETE | `/tuition/{id}` | Xóa · Quản lý học phí | ADMIN |
| GET | `/invoices` | Danh sách · Thu phí khóa học | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/invoices/{id}` | Chi tiết · Thu phí khóa học | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/invoices` | Tạo · Thu phí khóa học | ADMIN, MASTER |
| PATCH | `/invoices/{id}` | Sửa · Thu phí khóa học | ADMIN, MASTER, INSTRUCTOR |
| DELETE | `/invoices/{id}` | Xóa · Thu phí khóa học | ADMIN |
| GET | `/online-payments` | Danh sách · Hóa đơn | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/online-payments/{id}` | Chi tiết · Hóa đơn | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/online-payments` | Tạo · Hóa đơn | STUDENT |
| POST | `/online-payments/{id}/actions/process` | process · Hóa đơn | STUDENT |
| GET | `/transactions` | Danh sách · Lịch sử giao dịch | ADMIN, MASTER, STUDENT |
| GET | `/transactions/{id}` | Chi tiết · Lịch sử giao dịch | ADMIN, MASTER, STUDENT |
| GET | `/payment-confirmations` | Danh sách · Đối soát chuyển khoản | ADMIN, MASTER, INSTRUCTOR |
| GET | `/payment-confirmations/{id}` | Chi tiết · Đối soát chuyển khoản | ADMIN, MASTER, INSTRUCTOR |
| POST | `/payment-confirmations/{id}/actions/approve` | approve · Đối soát chuyển khoản | ADMIN, MASTER, INSTRUCTOR |
| POST | `/payment-confirmations/{id}/actions/reject` | reject · Đối soát chuyển khoản | ADMIN, MASTER, INSTRUCTOR |
| GET | `/tuition-relief` | Danh sách · Xem xét miễn giảm học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/tuition-relief/{id}` | Chi tiết · Xem xét miễn giảm học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/tuition-relief` | Tạo · Xem xét miễn giảm học phí | ADMIN, MASTER, INSTRUCTOR |
| POST | `/tuition-relief/{id}/actions/approve` | approve · Xem xét miễn giảm học phí | ADMIN, MASTER |
| POST | `/tuition-relief/{id}/actions/reject` | reject · Xem xét miễn giảm học phí | ADMIN, MASTER |
| GET | `/announcements` | Danh sách · Thông báo | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/announcements/{id}` | Chi tiết · Thông báo | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/announcements` | Tạo · Thông báo | ADMIN, MASTER, INSTRUCTOR |
| PATCH | `/announcements/{id}` | Sửa · Thông báo | ADMIN |
| DELETE | `/announcements/{id}` | Xóa · Thông báo | ADMIN |
| POST | `/announcements/{id}/actions/process` | process · Thông báo | MASTER, INSTRUCTOR |
| GET | `/student-report` | Danh sách · Báo cáo võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/attendance-report` | Danh sách · Báo cáo điểm danh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/tuition-report` | Danh sách · Báo cáo học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/promotion-report` | Danh sách · Báo cáo thăng đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/settings` | Danh sách · Cài đặt hệ thống | ADMIN |
| GET | `/settings/{id}` | Chi tiết · Cài đặt hệ thống | ADMIN |
| POST | `/settings` | Tạo · Cài đặt hệ thống | ADMIN |
| PATCH | `/settings/{id}` | Sửa · Cài đặt hệ thống | ADMIN |
| DELETE | `/settings/{id}` | Xóa · Cài đặt hệ thống | ADMIN |
| GET | `/audit` | Danh sách · Nhật ký hệ thống | ADMIN, MASTER, INSTRUCTOR |
| GET | `/audit/{id}` | Chi tiết · Nhật ký hệ thống | ADMIN, MASTER, INSTRUCTOR |
| POST | `/auth/login` | Đăng nhập | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/mfa/login-verify` | Xác thực bước hai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/refresh-token` | Đổi access token | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/auth/me` | Hồ sơ phiên hiện tại | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/logout` | Đăng xuất | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| PATCH | `/auth/profile` | Cập nhật liên hệ của tài khoản | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/change-password` | Đổi mật khẩu | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/forgot-password` | Gửi email khôi phục | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/auth/reset-password` | Đặt lại mật khẩu từ liên kết email | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/permissions` | Quyền và danh mục vai trò | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| PATCH | `/permissions` | Lưu ma trận quyền | ADMIN |
| GET | `/organization/navigation` | Cây đơn vị được truy cập | ADMIN, MASTER |
| GET | `/lookups` | Danh mục chọn theo phạm vi | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/dashboard` | Tổng quan theo vai trò và đơn vị | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/notifications` | Thông báo của tài khoản | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/notifications/read-one` | Đánh dấu đã đọc một thông báo | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| POST | `/notifications/read-all` | Đánh dấu đã đọc tất cả | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/exports/system` | Snapshot xuất Excel theo quyền | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/report-charts/student-report` | Biểu đồ · Báo cáo võ sinh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/report-charts/attendance-report` | Biểu đồ · Báo cáo điểm danh | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/report-charts/tuition-report` | Biểu đồ · Báo cáo học phí | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/report-charts/promotion-report` | Biểu đồ · Báo cáo thăng đai | ADMIN, MASTER, INSTRUCTOR, STUDENT |
| GET | `/attendance-workflow/dates` | Các ngày có lịch trong phạm vi | ADMIN, MASTER, INSTRUCTOR |
| GET | `/attendance-workflow/sessions` | Buổi tập theo ngày | ADMIN, MASTER, INSTRUCTOR |
| GET | `/attendance-workflow/sessions/{id}` | Xem roster; không tạo snapshot/khóa lịch | ADMIN, MASTER, INSTRUCTOR |
| POST | `/attendance-workflow/sessions/{id}/present` | present · điểm danh | ADMIN, MASTER, INSTRUCTOR |
| POST | `/attendance-workflow/sessions/{id}/close` | close · điểm danh | ADMIN, MASTER, INSTRUCTOR |
| POST | `/attendance-workflow/sessions/{id}/undo` | undo · điểm danh | ADMIN, MASTER, INSTRUCTOR |
| POST | `/attendance-workflow/sessions/{id}/correct` | correct · điểm danh | ADMIN, MASTER |
| POST | `/promotions/bulk-review` | Duyệt đề xuất theo lớp, nguyên tử cho toàn bộ ids | ADMIN, MASTER |
| POST | `/invoices/{id}/collect-cash` | Ghi nhận thu học phí tiền mặt (yêu cầu quyền P hoặc E, tự động đóng yêu cầu chuyển khoản chờ) | ADMIN, MASTER, INSTRUCTOR |
| POST | `/invoices/{id}/pay-online` | Gửi yêu cầu đối soát chuyển khoản ngân hàng cho hóa đơn | ADMIN, MASTER, INSTRUCTOR, STUDENT |
