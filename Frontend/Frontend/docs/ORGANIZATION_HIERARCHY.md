# Phân cấp tỉnh, phường, câu lạc bộ và lớp

Một tỉnh có nhiều phường; một phường có nhiều câu lạc bộ; mỗi lớp thuộc một câu lạc bộ. Trường `clubId` là bắt buộc khi tạo/sửa lớp.

| Tài khoản | Được xem | Được quản lý |
| --- | --- | --- |
| Admin cấp tỉnh | Dữ liệu trong tỉnh | Cấp tài khoản, phân quyền, phường, câu lạc bộ và nghiệp vụ trong tỉnh |
| Võ sư cấp tỉnh | Các phường, câu lạc bộ, lớp và nghiệp vụ trong tỉnh | Các phường và nghiệp vụ theo ma trận quyền; không cấp tài khoản/phân quyền |
| Võ sư cấp phường | Danh mục tất cả phường trong tỉnh; học phí, hóa đơn, miễn giảm và báo cáo học phí của toàn tỉnh; câu lạc bộ/lớp/học viên trong phường phụ trách | Câu lạc bộ, lớp, điểm danh, đơn từ và nghiệp vụ của phường phụ trách theo ma trận quyền |
| Võ sư chịu trách nhiệm câu lạc bộ | Các lớp và tên học viên đang học tại câu lạc bộ được giao | Chỉ xem; không sửa lớp, điểm danh, duyệt hồ sơ hoặc xem học phí |

Quyền xem học phí tất cả phường của Võ sư cấp phường được thực hiện theo yêu cầu. Hồ sơ tài chính ngoài phường phụ trách chỉ đọc, không có nút sửa/duyệt/xóa. Việc duyệt kết quả thi vẫn chỉ dành cho Admin.

## Admin cấp và phân quyền Võ sư

1. Vào **Tổ chức → Quản lý phường**, tạo phường trong tỉnh.
2. Vào **Quản lý câu lạc bộ**, chọn phường và tạo câu lạc bộ. Một phường có thể có nhiều câu lạc bộ.
3. Vào **Tài khoản người dùng → Thêm mới**, chọn vai trò **Võ sư**.
4. Chọn cấp tỉnh, cấp phường hoặc phụ trách câu lạc bộ. Cấp phường phải chọn phường; cấp câu lạc bộ phải chọn cả phường và câu lạc bộ thuộc phường đó.
5. Mỗi lớp chọn câu lạc bộ của mình. Cập nhật cấp/đơn vị tài khoản sẽ thu hồi phiên cũ; người dùng đăng nhập lại để nhận phạm vi mới.

Ma trận quyền chức năng tiếp tục do Admin cấu hình. Các giới hạn theo cấp và đơn vị là ranh giới bắt buộc: không thể mở rộng quyền Võ sư câu lạc bộ sang tài chính bằng cách cấp thêm quyền trong ma trận.

## Tài khoản mẫu

Mật khẩu chung: `Vovinam123!`.

| Email | Cấp | Đơn vị |
| --- | --- | --- |
| admin@vovinam.test | Admin | Tỉnh Đồng Nai |
| vosu@vovinam.test | Võ sư cấp tỉnh | Tỉnh Đồng Nai |
| vosuphuong@vovinam.test | Võ sư cấp phường | Phường Trấn Biên |
| vosuclb@vovinam.test | Võ sư phụ trách câu lạc bộ | CLB Trung tâm, phường Trấn Biên |

Tài khoản và cấp mẫu nằm trong `mock/users.js`. HLV/học viên giữ nguyên tài khoản và phạm vi lớp/cá nhân.

## Cấu trúc triển khai

- `mock/hierarchy.js`: chuyển đổi dữ liệu cũ một lần, kiểm tra cấp, phạm vi xem/xử lý và liên kết đơn vị.
- `src/features/wards/`, `src/features/clubs/`: các màn hình tổ chức riêng theo chức năng.
- `src/features/users/module.js`, `src/components/common/RecordForm.jsx`: biểu mẫu cấp tài khoản, chọn phường/câu lạc bộ liên động.
- `src/components/common/OrganizationScope.jsx`: hiển thị cấp, đơn vị và phạm vi trên màn hình.
- `tests/hierarchy.test.js`: kiểm thử chặn truy cập trái phạm vi, duyệt, điểm danh, báo cáo, Excel và chuyển đổi dữ liệu.

Áp dụng kiểm tra ở tầng mock cho cả URL truy cập trực tiếp, dữ liệu liên kết gửi lên, báo cáo, thông báo và xuất Excel. Dữ liệu cũ được bổ sung liên kết mẫu một lần, giữ nguyên hồ sơ, kết quả và ma trận nghiệp vụ hiện có. Vẫn chạy `VITE_USE_MOCK=true`; chưa gọi API thật. Khi tích hợp backend, các quy tắc phạm vi này cần được thực thi lại ở server.

## Kiểm tra

```bash
node --test tests/hierarchy.test.js tests/report-charts.test.js tests/tuition-relief.test.js tests/admin-result-notifications.test.js tests/workflows.test.js tests/exams-class-results.test.js tests/leaves-review.test.js tests/promotions-review.test.js tests/rank-catalog.test.js tests/attendance-export.test.js
npm run build
```
