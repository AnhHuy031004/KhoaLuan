# Phân quyền mock

V: xem; C: tạo; E: sửa; D: xóa; A: duyệt; P: xử lý. Đơn xin nghỉ đã xử lý bị khóa dù Admin có E/D. Học viên chỉ xem đơn của mình; HLV theo lớp phụ trách. Migration bổ sung quyền mặc định một lần cho DB cũ.

| Chức năng | ADMIN | MASTER | INSTRUCTOR | STUDENT |
| --- | --- | --- | --- | --- |
| Tài khoản người dùng | VCED | — | — | — |
| Vai trò & phân quyền | VCED | — | — | — |
| Hồ sơ võ sinh | VCED | VCE | V | VE |
| Đội ngũ võ sư | VCED | V | — | — |
| Huấn luyện viên | VCED | VCE | — | — |
| Quản lý lớp học | VCED | VCE | V | — |
| Phân lớp võ sinh | VCED | VCE | V | — |
| Lịch tập | VCED | VCE | VCE | V |
| Điểm danh | VCED | VCE | VCE | V |
| Đơn xin nghỉ | VCEDA | VA | VA | VC |
| Đánh giá võ sinh | VCED | VCE | VCE | V |
| Danh mục cấp đai | VCED | VCE | V | V |
| Đề xuất thăng đai | VCED | VCEA | VC | — |
| Kỳ thi thăng đai | VCED | VCEA | V | V |
| Kết quả thi | VCED | VCEA | V | V |
| Lịch sử cấp đai | V | V | V | V |
| Quản lý học phí | VCED | V | V | V |
| Hóa đơn học phí | VCED | VC | — | V |
| Thanh toán online | V | V | — | CP |
| Lịch sử giao dịch | V | V | — | V |
| Xác nhận thanh toán | VA | VA | VA | — |
| Quản lý khuyến mãi | VCED | V | — | — |
| Thông báo | VCED | VCP | VCP | V |
| Báo cáo võ sinh | V | V | V | V |
| Báo cáo điểm danh | V | V | V | V |
| Báo cáo học phí | V | V | V | V |
| Báo cáo thăng đai | V | V | V | V |
| Cài đặt hệ thống | VCED | — | — | — |
| Nhật ký hệ thống | V | V | V | — |
