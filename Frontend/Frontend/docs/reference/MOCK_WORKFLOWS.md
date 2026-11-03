# Hướng dẫn kiểm tra nghiệp vụ

## Hồ sơ và phân lớp

Admin/Võ sư tạo võ sinh, chọn lớp và cấp đai. Võ sinh chỉ thấy bản thân và chỉ được sửa email/số điện thoại. HLV thấy võ sinh trong lớp được giao. Khi chuyển lớp bằng hồ sơ hoặc phân lớp, dữ liệu liên kết được cập nhật. Lớp đủ sĩ số không nhận thêm.

Tạo tài khoản HLV sẽ tạo hoặc liên kết hồ sơ HLV bằng email, dùng chung ID để phân công lớp. Tạo tài khoản võ sinh yêu cầu có hồ sơ mang cùng email. Một số trường hồ sơ được bắt buộc để dữ liệu có thể dùng cho nghiệp vụ.

## Xin nghỉ

Đăng nhập Võ sinh → Đơn xin nghỉ → Tạo đơn. Vai trò này có C, không có V/A: chỉ hiển thị form gửi đơn. Đăng nhập HLV/Võ sư → Đơn xin nghỉ → Duyệt hoặc Từ chối. Chỉ xử lý đơn PENDING, không duyệt lại.

## Thăng đai

HLV tạo đề xuất; Võ sư có quyền duyệt. Tạo kỳ thi và nhập bảng điểm theo quyền trong bảng. Bốn cột điểm (quyền, lý thuyết/thể lực, căn bản, đối kháng) được cộng thành tổng; không tự áp ngưỡng đậu. Võ sư chọn Đạt hoặc Chưa đạt. Khi Đạt, hệ thống cập nhật cấp đai theo kỳ thi và thêm lịch sử. Không cho sửa kết quả đã chốt hoặc cấp đai lặp lại bằng thao tác duyệt lần hai.

## Học phí và thanh toán

Admin quản lý biểu phí và khuyến mãi; Admin/Võ sư tạo hóa đơn. Chọn khuyến mãi đang hiệu lực để giảm số tiền theo phần trăm. Võ sinh chỉ thấy hóa đơn của mình.

1. Võ sinh → Thanh toán online → Tạo giao dịch từ hóa đơn chưa thanh toán.
2. Chọn thao tác Gửi xác nhận (biểu tượng gửi), giao dịch chuyển từ DRAFT sang PENDING.
3. Admin/Võ sư/HLV theo phạm vi → Xác nhận thanh toán → Duyệt.
4. Hóa đơn chuyển PAID; giao dịch SUCCESS được ghi trong Lịch sử giao dịch. Không cho tạo yêu cầu trùng hoặc xác nhận lại hóa đơn đã trả.

Quyền C/P của Võ sinh cho phép xem trạng thái giao dịch đang xử lý của chính mình để hoàn tất P; không cấp quyền V để xem toàn bộ danh sách thanh toán của người khác. Lịch sử giao dịch là module V riêng.

Thanh toán chỉ mô phỏng, không liên hệ ngân hàng. Cần adapter gateway, webhook xác thực chữ ký và xác nhận server trước khi dùng tiền thật.

## Thông báo

Admin tạo thông báo phát hành trực tiếp. HLV/Võ sư tạo bản nháp rồi dùng P để phát hành. Thông báo ALL hoặc theo lớp; Võ sinh chỉ thấy bản phát hành trong phạm vi lớp/tất cả. Chuông thông báo giữ trạng thái đã đọc theo tài khoản.

## Phân quyền

Admin → Vai trò & phân quyền. Bảng ban đầu giống ảnh tham chiếu. Chọn Chỉnh sửa quyền → vai trò → tick quyền → Lưu phân quyền. Adapter mock dùng ma trận đã lưu cho mọi request. Các tài khoản đang đăng nhập nhận ma trận giao diện mới khi tải lại trang; server mock thực thi thay đổi ở request tiếp theo.

Có thể tạo vai trò mới ở bảng bên dưới, chỉnh quyền rồi gán trong Tài khoản người dùng. Vai trò mới ban đầu không có quyền module. Không xóa vai trò nền hoặc vai trò đang có người dùng; bảo vệ quyền quản lý phân quyền của Admin.

## Báo cáo và xuất file

Bốn báo cáo dùng cùng dữ liệu: võ sinh, điểm danh, hóa đơn, lịch sử cấp đai. Phạm vi theo vai trò và bộ lọc. Bộ lọc tháng của báo cáo điểm danh áp dụng cho bản ghi buổi tập trước khi tổng hợp. Nút Xuất dữ liệu xuất CSV UTF-8 BOM theo bộ lọc, tối đa 5.000 dòng; không phải XLSX. Dữ liệu lớn cần backend export riêng.
