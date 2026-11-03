# Luồng gửi và duyệt đơn xin nghỉ

## Sử dụng

1. Võ sinh vào Đơn xin nghỉ → Tạo đơn xin nghỉ → nhập ngày, lý do → Gửi đơn. Tên học viên là tài khoản đang đăng nhập, lớp được chọn sẵn theo hồ sơ.
2. Đơn chuyển Chờ duyệt. Học viên xem được các đơn của chính mình; không xem đơn người khác, không được duyệt.
3. Admin và Võ sư xem đơn trong phạm vi được cấp quyền; HLV xem đơn của lớp mình phụ trách. Admin đã được bổ sung quyền A để duyệt/từ chối.
4. Bấm biểu tượng duyệt → popup có học viên, lớp, ngày nghỉ, lý do, tên/vai trò người xử lý → Xác nhận.
5. Trạng thái hiển thị Admin/Võ sư/Huấn luyện viên đã duyệt, bên dưới là họ tên và thời điểm xử lý.
6. Người khác chỉ thấy trạng thái, không còn nút duyệt/từ chối/sửa/xóa của đơn đã xử lý. Đơn từ chối cũng ghi nhận người xử lý và khóa như vậy.

Chỉ người đầu tiên xử lý thành công. Bất kỳ request duyệt/từ chối tiếp theo trả 409 và không ghi đè reviewedBy/reviewedRole/reviewedName/reviewedAt. Admin cũng không thể sửa đơn đã duyệt để đưa về Chờ duyệt, hoặc xóa đơn đã xử lý.

## Đồng bộ mock

Dữ liệu mock nằm trong localStorage của cùng trình duyệt/origin. Để thử cùng lúc bốn tài khoản, mở bốn tab và đăng nhập mỗi tab một tài khoản; phiên đăng nhập dùng sessionStorage riêng. Không dùng cửa sổ ẩn danh/profile khác vì chúng không chia sẻ DB mock.

Storage event đồng bộ danh sách và popup giữa các tab; sự kiện nội bộ cập nhật trong cùng tab; focus/visibility refresh khi quay lại. Popup đang mở tự đổi thành chi tiết chỉ đọc nếu tài khoản khác đã xử lý. Web Locks ở localhost/HTTPS tuần tự hóa truy cập DB giữa các tab để tránh hai lần duyệt đồng thời. Đây là mô phỏng cục bộ, không đồng bộ giữa các máy. Khi kết nối API thật cần server cập nhật nguyên tử với điều kiện status=PENDING và phát sự kiện/polling tương ứng.

## Dữ liệu và nâng cấp

- Giữ nguyên DB key và các bản ghi đã tạo. Migration leaveWorkflowVersion=1 chỉ bổ sung A cho Admin và V cho học viên một lần, không reset hệ thống. Các thay đổi phân quyền sau migration được giữ nguyên.
- Đơn được duyệt mới lưu ID, vai trò, họ tên tại thời điểm xử lý, thời gian. Đổi tên/vai trò tài khoản sau đó không sửa snapshot đã lưu.
- Dữ liệu cũ chỉ có reviewedBy được đối chiếu với tài khoản hiện có để hiển thị tên/vai trò; không tự gán thời điểm cũ. Đơn cũ không có thông tin người duyệt giữ Đã duyệt và ghi Chưa có thông tin người xử lý, không bịa người duyệt. Seed mới có đủ thông tin người xử lý cho các đơn minh họa đã duyệt.
- Excel toàn hệ thống giữ các trường người duyệt và diễn giải trạng thái có vai trò; xuất học viên chỉ gồm đơn của bản thân.
- Điểm danh vẫn dùng đơn APPROVED của cùng học viên/lớp/ngày để xác định Có phép khi chốt buổi.

## Mã nguồn

Quyền: src/features/leaves/module.js. Hiển thị: components/LeaveStatus.jsx và reviewStatus.js. Giao diện danh sách/popup: src/components/common/FeaturePage.jsx, Table.jsx. Xử lý nguyên tử/khóa đơn: mock/api.js. Đồng bộ tab: src/services/providers/mockProvider.js. Test: tests/leaves-review.test.js.

## Nút thao tác

Duyệt dùng xanh trầm, Từ chối dùng đỏ trầm với viền nhẹ, đều có biểu tượng và nhãn chữ. Nút cao 30px trên desktop, 36px trên điện thoại; chữ 12,5px, icon 14px, có hover/focus rõ. Hai nút đặt cùng hàng, các thao tác phụ bên dưới để không bị khuất khỏi khung bảng desktop. Bảng điện thoại cuộn ngang riêng.
