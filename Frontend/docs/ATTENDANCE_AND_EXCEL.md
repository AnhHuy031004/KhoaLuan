# Điểm danh và Excel — 1.1.0

## Điểm danh theo buổi

1. Chọn ngày, lớp/buổi. Danh sách dùng mốc vào/rời lớp và phân công của buổi; xem chưa tạo snapshot cố định.
2. Chọn võ sinh bằng checkbox hoặc bấm dòng. Thao tác chọn chưa ghi điểm danh.
3. Bấm **Xác nhận có mặt (N)**, kiểm tra danh sách và xác nhận. Thao tác nhanh từng người cũng đi qua cùng hộp thoại.
4. Nếu bấm nhầm trước chốt, dùng **Hoàn tác**, nhập lý do. Chưa có mặt không đồng nghĩa vắng không phép.
5. Chốt riêng buổi khi đã kiểm tra. Người chưa ghi nhận chuyển thành Vắng hoặc Có phép nếu có đơn đã được duyệt.
6. Sau chốt, chỉ Admin/Võ sư có quyền E trong phạm vi mới được **Hiệu chỉnh**. Nhập trạng thái đúng và lý do. Không mở lại toàn bộ buổi để tránh mất snapshot.
7. Xem **Lịch sử hiệu chỉnh** để đối chiếu người xử lý, thời gian, lý do và trạng thái trước/sau. Đây là audit demo cục bộ; backend cần audit bất biến riêng.

Tab Vắng mặt sau chốt chỉ gồm ABSENT; EXCUSED thuộc Có phép. Số đếm và danh sách dùng chung điều kiện. Từ khóa không khớp luôn có thông báo không tìm thấy, không bị coi là đã điểm danh hết. Ngày/buổi/tab/từ khóa được lưu trên URL.

Bản ghi có điểm danh thực tế hoặc đã chốt bảo vệ lịch khỏi sửa/xóa. Lịch chỉ được mở xem chưa bị khóa. Buổi đang mở cập nhật danh sách còn hiệu lực; người đã có bản ghi được giữ lại để không mất dữ liệu khi đổi phân lớp. Buổi đã chốt giữ danh sách snapshot.

Nếu duyệt bổ sung đơn nghỉ sau khi đã chốt, quản lý đối chiếu và hiệu chỉnh có lý do; không tự thay trạng thái buổi cũ một cách âm thầm.

## Xuất danh sách

- Trang nghiệp vụ: **Xuất danh sách đang lọc**; lấy đủ các trang theo bộ lọc, không chỉ trang đang xem. Nếu danh sách thay đổi dẫn đến lặp/thiếu trang sẽ báo thử lại.
- Điểm danh: xuất danh sách toàn buổi đang mở, gồm trạng thái từng võ sinh. Lịch sử sửa sai có trong màn hình và bản xuất hệ thống.
- Đề xuất thăng đai: xuất đúng tập dữ liệu khớp bộ lọc đang hiển thị.
- Báo cáo/Cài đặt Admin: **Xuất toàn hệ thống**; bỏ qua tìm kiếm/phân trang nhưng vẫn theo phạm vi quyền, có hộp xác nhận dữ liệu cá nhân.
- Workbook có Tổng quan, Danh mục dữ liệu và các sheet dữ liệu. Không xuất mật khẩu/token/phiên đăng nhập. Chuỗi giống công thức giữ dạng text.
- Worker tạo XLSX để hạn chế chặn thao tác giao diện. Lookup theo Map; ô quá dài được tách cột; vượt giới hạn dòng Excel tách sheet.

Benchmark tổng hợp workbook trên Node với dữ liệu giả nằm ở `scripts/benchmark-export.mjs`. Kết quả không thay thế đo bộ nhớ/tương tác trên điện thoại. Với xuất rất lớn trong vận hành thật nên dùng job xuất và phân quyền phía server.
