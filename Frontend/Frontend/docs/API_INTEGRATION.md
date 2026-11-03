> Tài liệu tham chiếu giai đoạn API. Bản hiện tại mặc định dùng mock; xem README.md và docs/API_LATER.md.

# Tích hợp API thật

Nguồn: https://vovinamapinode.onrender.com/docs và /docs-json, được đọc trực tiếp trong yêu cầu này. Base API `/api/v1`, envelope `{code,message,data}`.

## Lớp kết nối

- `api.js`: mặc định `VITE_USE_MOCK=false`; session namespace `v3:api:`.
- `httpClient.js`: Bearer token, refresh rotation (một request đồng thời), timeout 45 giây, unwrap envelope, phân biệt lỗi 401/403/429.
- `liveContract.json`: DTO và quyền từ Swagger hiện tại.
- `livePolicy.js`: khả năng giao diện theo role/endpoint, danh sách trường create/edit và ép kiểu DTO. Không gửi field chỉ tồn tại trong mock.
- `liveAdapter.js`: chuẩn hóa response cho giao diện, tổng hợp lookups/Dashboard/báo cáo, ánh xạ các endpoint nghiệp vụ.

## Các ánh xạ chính

| Giao diện | Endpoint thật |
|---|---|
| Đăng nhập/MFA | POST /auth/login; POST /auth/mfa/login-verify |
| Phiên | GET /auth/me; POST /auth/refresh-token; POST /auth/logout |
| Hồ sơ võ sinh | /students; STUDENT: /students/me; PARENT: /parents/me/children |
| HLV | /users?role=INSTRUCTOR, chỉ Admin |
| Lớp/phân lớp | /classes; /enrollments |
| Lịch định kỳ | schedules trong /classes; POST/DELETE /classes/:id/schedules... |
| Điểm danh | POST /attendance-sessions; GET/POST /attendance-sessions/:id/records; lịch sử /students/:id/attendance |
| Đơn nghỉ | /leave-requests; /:id/review |
| Đề xuất đai | /promotion-proposals; /:id/review |
| Đánh giá | /evaluations?studentId=... |
| Cấp đai/thi | /belt-ranks; /belt-exams; /exam-registrations?studentId=... |
| Đăng ký thi | POST /belt-exams/:id/register |
| Ghi kết quả | POST /exam-registrations/:id/result |
| Hóa đơn | /invoices |
| QR | POST /payments/qr/:invoiceId |
| Thu tiền mặt | POST /payments/:invoiceId/confirm-cash, chỉ Admin |
| Giao dịch | GET /payments?invoiceId=... |
| Cấu hình thu phí | GET /admin/billing/settings (giao diện chỉ đọc) |
| Thông báo | /announcements; /notifications/me; PATCH /notifications/:id/read |
| Nhật ký | /admin/audit-log |

`/permissions`, `/lookups`, `/dashboard` chỉ là giao diện nội bộ của adapter, **không gửi lên backend**. Không có fallback dữ liệu mẫu khi endpoint thật lỗi. Các lỗi dữ liệu gợi ý/aggregate được hiển thị thay vì lấp bằng seed.

## Khác biệt với bảng mock

API hiện có ADMIN/INSTRUCTOR/STUDENT/PARENT, không có MASTER. Ma trận API phản ánh role của endpoint. Không sửa quyền cục bộ để giả làm backend hỗ trợ. Vai trò nền/quyền API chỉ đọc; quyền gán tài khoản vẫn qua PATCH /users/:id theo DTO của server.

API không có bốn cột điểm riêng. Để giữ bảng điểm hiện tại, adapter dùng codec `VOVINAM_SCORE_V1` trong resultNote như phiên bản cũ. Điểm chưa có không được giả thành 0. Khi backend thêm trường điểm chính thức cần migration và đổi codec. Kết quả dùng RESULT_PASS/RESULT_FAIL theo server.

Tạo lịch dùng weekday/startTime/endTime/effectiveFrom/effectiveTo, không gửi sessionDate giả. API không hỗ trợ sửa lịch trực tiếp: xóa slot và tạo lại theo quyền Admin. Lịch hiển thị ngày sắp tới từ thứ trong tuần để xem nhanh, kèm hiệu lực trong chi tiết.

Các endpoint list theo từng võ sinh/hóa đơn được tổng hợp thành giao diện danh sách. Adapter tải theo page 100, trần 50 page cho mỗi nguồn; báo lỗi khi vượt giới hạn, không lặng lẽ cắt số liệu. Cơ sở dữ liệu lớn nên bổ sung endpoint aggregate/export trên backend để tránh N+1. Cache lookups 30 giây theo từng tài khoản, làm mới sau thao tác ghi.

## Chạy và triển khai

Vite, Node server và Nginx đi kèm có proxy `/backend` sang HTTPS API. Khi deploy bằng hosting tĩnh khác, phải cấu hình proxy tương đương hoặc URL tuyệt đối và backend CORS. Không dùng `/docs` làm URL API, không nhúng secrets vào VITE_.

Đã kiểm tra thật: /healthz 200; một login bằng tài khoản cố ý không tồn tại trả 401; proxy Node gọi /auth/me không có token trả 401 từ backend. Không có tài khoản hợp lệ được cung cấp nên chưa xác nhận phiên đăng nhập thực thành công hoặc ghi dữ liệu trên máy chủ. Các kiểm tra thành công/MFA/DTO/UI dùng fixtures theo Swagger, không giả thành bằng chứng đăng nhập thật.
