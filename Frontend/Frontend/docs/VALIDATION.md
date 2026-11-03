# Kiểm tra bản duyệt đơn xin nghỉ

- npm test: 33/33 đạt. Gồm 28 kiểm thử HTTP/mock/live-adapter/điểm danh/XLSX hiện có và 5 kiểm thử mới về duyệt đơn.
- npm run build: production mock đạt.
- Mỗi vai trò ADMIN/MASTER/INSTRUCTOR đều có thể là người duyệt đầu tiên. Các lần approve/reject tiếp theo trả 409, không thay người duyệt/thời điểm. Admin không thể sửa/xóa đơn đã xử lý.
- Student gửi đơn và chỉ xem đơn của mình; không được tự duyệt, giả metadata người duyệt hoặc xem đơn ngoài phạm vi. HLV theo lớp trên đơn. Migration quyền chỉ chạy một lần và giữ dữ liệu hiện có.
- Snapshot tên/vai trò không bị thay đổi khi tài khoản người duyệt đổi tên/vai trò về sau. Excel chứa thông tin người duyệt và diễn giải trạng thái.

## Kiểm tra trình duyệt production

Xem leaves-ui-results.json:

- 4 tab cùng browser context/origin, mỗi tab một tài khoản. Học viên gửi đơn qua form; cả ba người phụ trách nhìn thấy đơn.
- HLV duyệt một đơn: admin và võ sư đang mở popup được cập nhật thành chi tiết chỉ đọc; không còn nút xác nhận. Học viên thấy trạng thái có vai trò, tên người duyệt.
- Ba popup duyệt một đơn khác được bấm gần như đồng thời: chỉ một lần duyệt được ghi nhận; người thắng được giữ nguyên trên cả bốn tab.
- Hàng đã xử lý chỉ có Xem, không có Duyệt/Từ chối/Sửa/Xóa. Sau reload vẫn giữ trạng thái.
- Tải và đọc XLSX thật của học viên: chỉ có đơn bản thân, đủ reviewedRole/reviewedName/reviewedAt và diễn giải trạng thái.
- Không có lỗi JavaScript, không gọi API thật; viewport 390px không tràn ngang khung trang (bảng cuộn ngang riêng).

Các kiểm tra này dùng dữ liệu mock cục bộ, không chứng minh đồng bộ giữa các máy. Backend API được giữ riêng, chưa bật.

Bản cập nhật nút: build production đạt; kiểm tra UI hai nhãn/màu, cùng hàng và nằm trọn trong khung bảng desktop, mở đúng popup Duyệt/Từ chối, vùng bấm 30/36px, không lỗi console hoặc tràn ngang trang ở 390px.

Tinh chỉnh thẩm mỹ: nút nhỏ hơn, màu trầm, bỏ bóng đổ, thu gọn biểu tượng phụ và khoảng cách; xác minh lại hai nút cùng hàng, nằm trọn trong bảng desktop và mở đúng popup. Build đạt.
