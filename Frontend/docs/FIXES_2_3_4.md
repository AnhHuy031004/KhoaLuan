# Sửa lỗi màn hình “Không thể hiển thị trang” — 2.3.4

Đầu vào: `Frontend(20261126-073005).zip`. Ngày: 26/11/2026.

## Nguyên nhân đã tái hiện

Ở màn hình riêng `payment-confirmations`, bấm **Chi tiết** sau khi chọn **Đã xác nhận** làm `RecordDetail` nhận prop `record` thay vì `row`, đồng thời thiếu `user`, `resolve` và `columnLabel`. Component đọc `user.role` và phát sinh TypeError; ErrorBoundary ở ngoài cùng thay toàn bộ giao diện bằng thông báo trong ảnh.

Ca kiểm thử mới đã tái hiện lỗi trên bản đầu vào trước khi sửa. Các test trước đây mở bảng chung chưa bao phủ thao tác Chi tiết của màn hình đối soát riêng.

## Các thay đổi

- Truyền đầy đủ dữ liệu và hàm hiển thị cho `RecordDetail`; dịch tên trường, hiển thị đúng võ sinh, lớp, hóa đơn, người xử lý, lý do và thời gian.
- Sửa cách dùng `Badge` tại đối soát để nhãn/màu trạng thái không bị trống.
- Sửa tab **Tất cả**: lưu trạng thái ALL rõ ràng trên URL, không tự quay về Chờ đối soát.
- Mở đúng yêu cầu từ query `record`, hiển thị lỗi tải chi tiết nếu API từ chối; đóng hộp thoại xóa query liên quan.
- Khóa đóng hộp thoại từ chối khi đang gửi yêu cầu.
- Tách giao diện nhân sự và võ sinh tại đối soát/đánh giá để thứ tự React hooks không thay đổi khi role thay đổi.
- Bổ sung ESLint kiểm tra JSX chưa khai báo và rules-of-hooks trên toàn bộ src.
- Sửa bộ kiểm thử để chờ đúng `.system-loading` hiện hành; không xem việc tiêu đề đã xuất hiện là dữ liệu đã tải xong.
- Bổ sung kiểm tra thao tác trên toàn bộ module được cấp quyền cho Admin, võ sư tỉnh/phường/CLB, HLV và võ sinh. Kiểm tra bộ lọc, mở chi tiết, mở/đóng form và các tab đối soát; không chỉ mở route ban đầu.

## Phạm vi kiểm tra

Báo cáo chi tiết từng lượt: `docs/validation/page-interactions-2.3.4.json`.

- 162 lượt mở trang, gồm các module được cấp quyền và dashboard/profile của sáu tài khoản.
- 286 lựa chọn trạng thái, 78 lượt mở chi tiết, 26 lượt mở biểu mẫu.
- Kiểm tra riêng trang thật `/app/payment-confirmations?status=SUCCESS`, link yêu cầu chờ xử lý, từ chối có lý do, xem lại bản ghi đã từ chối và chuyển tab Tất cả.
- Kiểm tra thay đổi vai trò ngay khi component đang hiển thị.
- Bộ kiểm thử xác nhận tiền mặt, lịch lặp, in biên nhận và các quy tắc nghiệp vụ trước đó vẫn được giữ.

Kiểm tra toàn bộ: **340/342 ca đạt; 2 ca v2.4 có sẵn trong ZIP đầu vào chưa đạt**. Hai ca này đã được chạy lại trên bản đầu vào chưa chỉnh sửa và cũng thất bại. Chúng yêu cầu đổi phân quyền, đổi tên menu tài chính, nối tính năng tạo kỳ thu hàng loạt và dọn nguồn cũ; đây không phải các lỗi render được sửa trong bản này. Giữ nguyên các test và chính sách quyền hiện tại, không xóa/skip để tạo kết quả xanh.

Riêng lượt kiểm tra trang theo sáu vai trò: 151/151 ca đạt (150 module theo quyền + ca tổng hợp), với 162 lượt route kể cả dashboard/profile. Lint, build và kiểm tra hợp đồng API đều đạt.

Số lượng test và kết quả cuối cùng nằm trong `docs/VERIFICATION_2_3_4.json` và `docs/validation/fixes-2.3.4-check.log`.

Các phép kiểm tra giao diện dùng React DOM/JSDOM và fixture HTTP. Chưa kiểm chứng hình thức hiển thị trên trình duyệt/thiết bị thật, backend sản phẩm hay ngân hàng thật. Không khẳng định không còn mọi lỗi ở những thao tác hoặc dữ liệu nằm ngoài phạm vi trên.

## Chạy bản sửa

Giải nén sang một thư mục mới, vào thư mục Frontend:

```bash
npm ci
npm run dev
```

Giữ nguyên cấu trúc chức năng. File `BatchInvoiceModal.jsx` bổ sung trong ZIP đầu vào được giữ nguyên. Không thêm thao tác xóa hoặc reset dữ liệu đang lưu của người dùng. Dist được build lại từ nguồn hiện tại, không đóng gói node_modules hay bản nguồn Frontend lồng nhau.

Chạy lại lượt kiểm tra trang: `npm run test:pages`. `npm test` vẫn báo hai yêu cầu v2.4 chưa được hiện thực như mô tả trên.
