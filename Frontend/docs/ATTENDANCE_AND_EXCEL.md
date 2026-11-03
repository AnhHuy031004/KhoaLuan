# Điểm danh theo buổi và xuất Excel

## Điểm danh (mock)

ADMIN, MASTER và INSTRUCTOR vào Điểm danh:

1. Chọn Ngày điểm danh trong dropdown. Các ngày lấy từ lịch tập chưa hủy trong phạm vi phụ trách.
2. Hệ thống hiển thị tất cả buổi tập của ngày; chọn một buổi.
3. Danh sách hiện đầy đủ học viên đang hoạt động được phân trực tiếp vào buổi (`studentIds` nếu có), hoặc có phân lớp còn hiệu lực tại ngày tập. Không phân trang danh sách này.
4. Tick học viên có mặt → Có mặt ở góc phải bảng → xem tên trong popup → Xác nhận.
5. Toast thành công; học viên đã có mặt hiển thị chìm, ô tích khóa. Học viên còn lại vẫn có ô tích trống để bổ sung khi đến muộn. Có thể xác nhận theo nhiều đợt trước khi chốt.
6. Bấm Chốt điểm danh buổi học ở trên cùng bên phải → popup kiểm tra sĩ số → Xác nhận chốt điểm danh.
7. Học viên chưa có mặt chuyển Vắng mặt; người có đơn nghỉ đã duyệt chuyển Có phép. Buổi chốt được khóa, lưu thời điểm và người chốt. Không mở lại trong bản này.

Nếu đang tick nhưng chưa xác nhận, nút chốt bị khóa để tránh bỏ sót thao tác. Hủy popup không ghi thay đổi. Đổi ngày/buổi bỏ lựa chọn chưa xác nhận. Buổi không có học viên không thể chốt.

HLV chỉ thấy buổi của lớp được giao. Võ sinh xem lịch sử của chính mình, không có các nút phụ trách. Mock kiểm tra quyền cả ở UI và bộ xử lý dữ liệu. Không dùng chung trạng thái giữa các buổi cùng lớp/ngày: khóa chính là scheduleId. Danh sách được chụp lại khi mở điểm danh; lịch đã mở điểm danh không được sửa/xóa để tránh làm sai lịch sử. Bản ghi cũ theo lớp/ngày chỉ ghép tự động nếu có đúng một buổi cho lớp trong ngày đó.

Dữ liệu có mặt/đi muộn được báo cáo như trước; các lần xác nhận bổ sung qua nút Có mặt lưu trạng thái PRESENT cùng thời điểm xác nhận thực tế. Mỗi học viên chỉ có một bản ghi trong buổi. Chốt chỉ ảnh hưởng buổi đang chọn, không chốt các buổi khác trong ngày.

Các endpoint `/attendance-workflow/*` là hợp đồng mock; service UI riêng tại `features/attendance/services/sessionAttendanceService.js`. Khi ghép API thật cần ánh xạ các thao tác này với backend tương ứng. Bản API để dành vẫn dùng màn hình API trước đây, không gửi những endpoint mock này lên server thật.

## Xuất toàn hệ thống (.xlsx)

Tất cả nút xuất trên trang chức năng, điểm danh và Tổng quan dùng cùng một service. Một lần xuất tạo workbook XLSX thực, không đổi đuôi CSV:

- Toàn bộ dữ liệu nghiệp vụ được cấp quyền, không áp dụng tìm kiếm, lọc hoặc phân trang đang xem; không còn giới hạn 5.000 dòng.
- ADMIN xuất toàn bộ bảng nghiệp vụ. Vai trò khác chỉ xuất các module và bản ghi trong phạm vi quyền tương ứng; không bỏ qua phân quyền.
- Mỗi bảng là một sheet, có Tổng quan (người xuất, thời điểm, phạm vi), Danh mục dữ liệu (số bản ghi), báo cáo, trạng thái các buổi điểm danh và danh sách học viên từng buổi. Có cả ma trận quyền đối với Admin.
- Các sheet giữ ID, toàn bộ trường nghiệp vụ và thêm tên tham chiếu khi có. Số tiền là số, điện thoại/mã là chuỗi giữ số 0 đầu. Các trường cấu trúc được giữ dưới dạng JSON trong ô.
- Không xuất mật khẩu, access/refresh token, bí mật MFA, reset token hoặc phiên đăng nhập. Đây là bản xuất nghiệp vụ, không phải bản sao xác thực để khôi phục tài khoản.
- Ô trên 30.000 ký tự chia thành các cột phần 2, phần 3 để giữ đủ văn bản; vượt số hàng Excel thì chia sheet tiếp. Dữ liệu bắt đầu bằng dấu bằng được giữ dạng văn bản, không tự thành công thức.

XLSX được lazy-load khi xuất, không dùng CDN. Cài dependencies một lần với npm ci. Dữ liệu xuất là snapshot tại thời điểm bấm nút; thay đổi sau đó cần xuất lại.

## Giao diện

Đã bỏ Sparkles ở nhãn sidebar và banner Dashboard; biểu tượng Đánh giá võ sinh thay bằng biểu tượng người, không dùng hình sao. Logo Vovinam giữ nguyên.
