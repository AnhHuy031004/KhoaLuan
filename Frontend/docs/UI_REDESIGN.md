# Giao diện quản trị Vovinam 2.1.0

## Vấn đề đã xử lý

- Sidebar cũ đóng toàn bộ nhóm trên trang tổng quan, tiêu đề không có dấu hiệu tương tác và để lại vùng trống. Bản mới mở sẵn các nhóm có quyền, có chevron, số chức năng, tìm kiếm tiếng Việt có/không dấu. Thu gọn nhóm được giữ khi chuyển trang; nhóm của trang đang mở tự mở lại.
- Nền tối và các nút xanh gần giống nhau làm mất thứ bậc. Mặc định mới là nền sáng, bề mặt trắng, chữ đậm vừa phải, sidebar navy, màu xanh cho thao tác chính và vàng cho việc cần chú ý. Lựa chọn giao diện đã lưu của người dùng vẫn được tôn trọng.
- Dashboard được dựng lại: số liệu có nhãn/đơn vị, lối tắt có icon, công việc chờ xét duyệt có số lượng riêng, lịch tập có ngày/giờ/địa điểm, thông báo có ngày và nội dung rút gọn. Không tạo số liệu xu hướng giả.
- Header có bộ chọn đơn vị ở cả desktop và mobile. Bộ tìm kiếm, thông báo và hồ sơ giữ cùng luồng nghiệp vụ.
- Danh sách dùng thanh tìm kiếm/bộ lọc rõ ràng, nút chính riêng biệt, hàng có khoảng thở. Cột thao tác cố định bên phải khi cuộn ngang. Nút xóa đặt trong “Khác” và giữ bước xác nhận.
- Dưới 600px, bảng dùng thẻ có nhãn từng trường và nút thao tác bằng chữ. Các bảng điểm danh/ma trận quyền chuyên biệt giữ hình thức phù hợp với dữ liệu của chúng.
- Form chia nhóm, cỡ nhập phù hợp, lỗi từng trường, focus trường lỗi và bảo vệ nội dung chưa lưu. Ngày sinh mới để trống thay vì tự điền hôm nay.
- Menu dưới 900px thành drawer, có nút đóng, Escape, giữ focus bên trong và khóa tương tác nền. Có liên kết bỏ qua điều hướng.
- Điểm danh giảm padding lồng nhau và chiều cao các thẻ buổi tập. Trên điện thoại, các buổi tập nằm trong vùng cuộn ngang có hướng dẫn, tránh đẩy roster xuống sau sáu thẻ dọc.
- Đăng nhập, báo cáo, đơn vị, các bảng/form dùng token màu, bo góc, cỡ nút và khoảng cách chung. Đăng nhập mobile có logo riêng.

## Bàn giao BE

Hợp đồng API vẫn là 2.0.0: 31 module, 101 đường dẫn, 164 operation và 140 schema. Đổi giao diện không thêm endpoint hoặc thay quyền nghiệp vụ. Production mặc định HTTP; development fixtures dùng cùng component sản phẩm. Không đưa công cụ QA hoặc cơ chế cấp phiên QA vào gói bàn giao.

Các file chính: `src/styles/workspace.css`, layout trong `src/components/layout`, dashboard, bảng/form dùng chung và bộ chọn buổi tập. Đây là lớp thiết kế dùng chung cuối cùng sau các stylesheet hiện có; cần duy trì token màu khi bổ sung màn hình.

## Kiểm tra

- 162/162 test tự động đạt; toàn bộ 31 module Admin render qua HTTP fixture; các luồng vai trò, quyền, scope, form, điểm danh, thanh toán và Excel giữ kiểm thử hiện hành.
- Kiểm tra trực quan Chrome desktop 1366px và iframe 390px; đã thấy dashboard, danh sách võ sinh và form, menu và thẻ mobile, giao diện tối, điểm danh và báo cáo.
- Build HTTP và fixtures thành công. Gói production chỉ chứa build HTTP và source cần bàn giao.
- Cần nghiệm thu tiếp trên thiết bị thật và BE dự án. Chưa có bằng chứng chạy cùng BE thật nên không coi HTTP fixture là nghiệm thu tích hợp cuối.

## Checklist nghiệm thu giao diện

1. Đăng nhập từng vai trò; chức năng trong menu đúng quyền.
2. Tìm “vo sinh”, “hoc phi”; mở/đóng nhóm bằng chuột và bàn phím.
3. Đổi Tỉnh/Phường/CLB; tiêu đề phạm vi và dữ liệu cùng thay đổi.
4. Tìm/lọc/phân trang; cuộn ngang bảng vẫn thấy nút thao tác; trên mobile thẻ có đủ nhãn.
5. Thêm/sửa, lỗi trường, đóng form chưa lưu và xác nhận xóa/xét duyệt.
6. Chọn ngày/buổi tập, điểm danh, chốt, sửa có lý do; không nhầm chọn hàng với xác nhận có mặt.
7. Thử 390px, 768px, 1024px, desktop và zoom 200%; đọc rõ trạng thái, không có nút ngoài vùng chạm.
8. Thử sáng/tối và chế độ giảm chuyển động; thông báo lỗi có cách thử lại.
