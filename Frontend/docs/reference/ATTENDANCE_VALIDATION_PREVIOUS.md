# Kiểm tra bản điểm danh và Excel

- npm test: 28/28 đạt (23 regression hiện có + 5 kiểm thử luồng điểm danh/đóng buổi/xuất XLSX).
- npm run build: production mock đạt, XLSX tải động khi cần xuất.
- Kiểm tra service: roster theo phân lớp hoặc phân công buổi, khóa theo scheduleId, xác nhận trùng không tạo trùng, batch lỗi không ghi một phần, bổ sung có mặt trước chốt, từ chối sau chốt, không sửa/xóa lịch đã mở, phân quyền HLV/võ sinh, hai buổi cùng ngày độc lập, đơn nghỉ đã duyệt và snapshot roster.
- Xuất snapshot có 6.024 học viên không bị cắt 5.000 dòng; không áp dụng search/page/limit từ màn hình; không xuất mật khẩu/token và không lộ dữ liệu ngoài quyền.
- XLSX roundtrip: đọc lại workbook bằng thư viện, giữ số tiền dạng số, điện thoại dạng chuỗi có số 0 đầu, ô dài chia cột đầy đủ và chuỗi bắt đầu bằng = không trở thành công thức.

## Trình duyệt production

Chi tiết: attendance-export-ui-results.json.

- ADMIN/MASTER/INSTRUCTOR: chọn ngày, chọn buổi, hiện đúng roster, hủy popup không ghi, xác nhận đợt đầu, hàng có mặt chìm/khóa checkbox, chọn người đến muộn và xác nhận đợt tiếp, hủy/chấp nhận chốt, khóa buổi sau chốt, tải lại vẫn giữ trạng thái, đổi ngày không trộn dữ liệu.
- HLV thấy 2 buổi lớp được giao, ADMIN/MASTER thấy 6 buổi ngày mẫu. Võ sinh không có giao diện thao tác điểm danh của người phụ trách.
- Cả 4 vai trò tải XLSX thật khi search trên màn hình không có kết quả. Workbook lần lượt có 35/31/25/22 sheet (gồm metadata), dữ liệu học viên theo phạm vi 24/24/8/1 người.
- Không phát hiện lỗi JavaScript hoặc request đến API thật trong các lượt này.
- Kiểm tra 390px không tràn ngang khung trang; bảng học viên cuộn ngang riêng.
- Không còn biểu tượng Sparkles/Star trên sidebar/banner.

Các báo cáo kiểm tra cũ ở docs là tham chiếu của những phiên bản trước; bản hiện hành dùng mock, không MFA và chưa bật API thật.
