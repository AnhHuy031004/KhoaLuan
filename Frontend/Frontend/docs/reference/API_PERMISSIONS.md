> Tài liệu tham chiếu giai đoạn API. Bản hiện tại mặc định dùng mock; xem README.md và docs/API_LATER.md.

# Quyền trong chế độ API

Nguồn: Swagger hiện tại. MASTER/Võ sư chưa được API hỗ trợ. Ma trận dưới đây là khả năng giao diện theo endpoint, server vẫn kiểm tra quyền và ownership cho mỗi request.

| Chức năng | Quản trị viên | Huấn luyện viên | Võ sinh | Phụ huynh |
|---|---|---|---|---|
| Tài khoản người dùng | VCED | — | — | — |
| Vai trò & phân quyền | V | — | — | — |
| Hồ sơ võ sinh | VCED | V | VE | V |
| Đội ngũ võ sư | — | — | — | — |
| Huấn luyện viên | VCED | — | — | — |
| Quản lý lớp học | VCE | V | V | V |
| Phân lớp võ sinh | VCD | — | — | — |
| Lịch tập | VCD | V | V | V |
| Điểm danh | VCE | VCE | V | V |
| Đơn xin nghỉ | VCDA | VA | VC | VC |
| Đánh giá võ sinh | VCED | VCED | V | V |
| Danh mục cấp đai | VCE | V | V | V |
| Đề xuất thăng đai | VCEA | VCE | V | V |
| Kỳ thi thăng đai | VCE | V | VP | VP |
| Kết quả thi | VE | VE | V | V |
| Lịch sử cấp đai | V | V | V | V |
| Quản lý học phí | V | — | — | — |
| Hóa đơn học phí | VC | — | V | V |
| Thanh toán online | VC | — | VC | VC |
| Lịch sử giao dịch | V | — | V | V |
| Xác nhận thanh toán | VA | — | V | V |
| Quản lý khuyến mãi | VCED | — | — | — |
| Thông báo | VCED | VCED | V | V |
| Báo cáo võ sinh | V | V | V | V |
| Báo cáo điểm danh | V | V | V | V |
| Báo cáo học phí | V | — | V | V |
| Báo cáo thăng đai | V | V | V | V |
| Cài đặt hệ thống | V | — | — | — |
| Nhật ký hệ thống | V | — | — | — |

V xem; C tạo; E sửa; D xóa; A review/xác nhận; P đăng ký thi. Các quyền từ bảng mock được giữ ở reference/mock-permissions.json để đối chiếu, không được dùng để cấp quyền API.
