# Trạng thái màn hình và tiêu chí nghiệm thu

| Màn/luồng | Đang tải / rỗng / lỗi | Thành công / quyền / xung đột |
| --- | --- | --- |
| Đăng nhập | Khóa gửi khi chờ; lỗi đăng nhập giữ email | Điều hướng về trang yêu cầu trước login; hỗ trợ bước MFA do BE trả |
| Quên/đặt lại mật khẩu | Phản hồi chung tránh lộ tài khoản; link thiếu token có hướng gửi lại | Form nhập và xác nhận mật khẩu; không hiển thị token từ fixture trong UI |
| Dashboard | Loading/lỗi có Thử lại; số chờ xử lý tải lỗi có phản hồi | Lịch, công việc và shortcut theo quyền; không có banner công cụ phát triển |
| Đơn vị | Loading/không có đơn vị/lỗi phân quyền tách biệt | Header đổi phạm vi; reset lớp/trang/bản ghi con khi đổi đơn vị |
| Danh sách | Loading; chưa có dữ liệu; không khớp bộ lọc; lỗi HTTP | URL giữ bộ lọc và Back/Forward; đúng trạng thái từng module; đủ phân trang |
| Form | Validate bắt buộc; lỗi BE tại ô; giữ giá trị khi lưu lỗi | Guard dirty X/Escape/outside/Hủy/link; khóa gửi/đóng khi lưu; toast sau API thành công |
| Điểm danh | Chưa có lịch/người hoặc tìm không khớp có thông báo đúng | Chọn chưa ghi DB; xác nhận mới ghi; hoàn tác trước chốt và quản lý hiệu chỉnh sau chốt có lý do/lịch sử |
| Đề xuất/thi/miễn giảm | Rỗng theo lớp hoặc chưa có bản ghi | Hiện người/thời gian xử lý; 409 tải lại; tên nút batch nêu chính xác tập được chọn/theo lọc |
| Hóa đơn | Lọc theo lớp/kỳ và lỗi phí/miễn giảm hiện rõ | Preview phí gốc/giảm/phải thu; chỉ Admin override kèm lý do; hóa đơn đã phát hành không âm thầm đổi |
| Yêu cầu thanh toán | Chọn đúng hóa đơn; không tự kết luận chuyển tiền | DRAFT → PENDING → SUCCESS/REJECTED; chỉ xác nhận thành công khi API duyệt trả thành công |
| Thông báo | Rỗng và lỗi tải có phản hồi | Link tới bản ghi cụ thể; đánh dấu đọc có lỗi phản hồi; không đánh dấu thành công giả |
| Báo cáo/Excel | Biểu đồ rỗng không NaN; lỗi có tải lại | Danh sách lọc lấy đủ trang; xuất toàn quyền có xác nhận; không xuất bí mật |
| 403/404/phiên | Không tự hiện dữ liệu mẫu | 403 giữ phiên, 404 có điều hướng, hết phiên quay login |

## Kiểm tra responsive và tiếp cận trước nghiệm thu sản phẩm

Kiểm tra trực tiếp 360/390/430/768/1440 px: login, header/sidebar, form dài, thẻ điểm danh/hóa đơn, popup thông báo và bảng. Kiểm tra Tab/Shift+Tab/Escape, zoom 200%, nhãn truy cập, focus sau đóng dialog và tương phản sáng/tối. Các test JSDOM xác nhận DOM/hành vi, không có bộ máy layout để chứng nhận pixel hoặc tương phản trên thiết bị thật.

Không có điều kiện `IS_MOCK` trong các trang, router hay provider quyền của giao diện hiện hành. Điều kiện dữ liệu nằm duy nhất ở tầng dịch vụ; build production dùng HTTP.
