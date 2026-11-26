# Báo cáo Nâng cấp Hệ thống Quản lý Vovinam — Phiên bản 2.2.0

## 1. Tổng hợp khắc phục toàn bộ 11 lỗi/cảnh báo nghiệp vụ & kỹ thuật

1. **Khôi phục màn hình Đối soát chuyển khoản riêng biệt (`PaymentConfirmationsPage.jsx`):**
   - Tách độc lập khỏi `OnlinePaymentsPage.jsx`, mở hiển thị lại trên menu Sidebar (`hiddenInNav: false`) và đưa vào khu vực **Công việc chờ xử lý** trên Dashboard.
   - Bổ sung bộ lọc trạng thái (`Chờ đối soát`, `Đã xác nhận`, `Từ chối / Đã đóng`, `Tất cả`), thao tác **Xác nhận** hoặc **Từ chối kèm lý do bắt buộc**, thông báo hai chiều giữa Võ sinh và Quản lý, cùng nút **In biên nhận**.
2. **Chặn thu nhầm hóa đơn đang bị ẩn khi lọc (`InvoicesPage.jsx` + `CashConfirmModal.jsx`):**
   - Tự động loại bỏ các hóa đơn không còn nằm trong `filteredList` khỏi `selectedIds` (`visibleSelectedIds`).
   - Bắt buộc mở hộp thoại xác nhận `CashConfirmModal` hiển thị rõ số lượng, danh sách từng học viên và tổng số tiền thực thu trước khi ghi nhận.
3. **Siết chặt phân quyền thu phí (`InvoicesPage.jsx`, `invoices/module.js`, `mock/api.js`):**
   - Loại bỏ hoàn toàn cơ chế tự cấp quyền theo tên vai trò (`['ADMIN', 'MASTER', 'INSTRUCTOR']`).
   - Bổ sung quyền nghiệp vụ `P` (*Ghi nhận thu tiền*) và chỉ cho phép thu tiền mặt khi ma trận phân quyền cấp `P` hoặc `E`. Khi thu hồi quyền của HLV về `V`, cả giao diện lẫn API đều chặn (HTTP `403`).
4. **Đồng bộ hợp đồng OpenAPI (`scripts/generate-handoff.mjs`, `contracts/openapi.json`):**
   - Bổ sung đầy đủ `/invoices/{id}/collect-cash` và `/invoices/{id}/pay-online`, tái tạo toàn bộ contract (31 module, 103 paths, 166 operations) và vượt qua `node scripts/generate-handoff.mjs --check`.
5. **Xử lý xung đột thu tiền mặt khi đã có yêu cầu chuyển khoản chờ (`CashConfirmModal.jsx`, `mock/api.js`):**
   - Cảnh báo rõ trong hộp thoại thu tiền mặt nếu hóa đơn đang có yêu cầu chuyển khoản chờ duyệt.
   - Khi xác nhận thu tiền mặt, hệ thống tự động đóng yêu cầu chuyển khoản cũ (`supersededByCash: true`) kèm lý do rõ ràng, giữ nguyên lịch sử đối chiếu và hỗ trợ `idempotencyKey` chống thu trùng.
6. **Kiểm tra dữ liệu hồ sơ dùng chung (`src/utils/validation.js`, `RecordForm.jsx`, `mock/api.js`):**
   - Chặn ngày sinh trong tương lai (như `2099-01-01`), chặn số điện thoại sai định dạng (như `abc`), chuẩn hóa khoảng trắng họ tên và số điện thoại ở cả Frontend lẫn mock API.
7. **Sinh mã võ sinh tăng dần duy nhất (`mock/api.js`):**
   - Dùng bộ đếm độc lập `db.counters.studentCode` kết hợp kiểm tra duy nhất; xóa võ sinh cũ không bao giờ gây trùng mã `VSxxxx` khi thêm mới.
8. **Đồng bộ bộ lọc với URL và phạm vi đơn vị (`InvoicesPage.jsx`, `PaymentConfirmationsPage.jsx`, `OnlinePaymentsPage.jsx`):**
   - Đồng bộ hai chiều bộ lọc khi URL thay đổi từ bên ngoài và tự xóa `classId` cũ nếu đổi phạm vi phường/CLB.
9. **Thống nhất nút "Xuất danh sách đang lọc" (`InvoicesPage.jsx`, `SessionAttendancePage.jsx`):**
   - Truyền trực tiếp `filteredList` / `filteredRows` và đầy đủ tham số lọc (kể cả hình thức đóng và bộ lọc điểm danh) vào `FilteredExportButton`.
10. **Chặn chốt điểm danh buổi tập trong tương lai (`SessionAttendancePage.jsx`, `mock/attendance-workflow.js`):**
    - Mặc định chặn HLV chốt điểm danh trước khi buổi tập kết thúc; chỉ cho phép cấp quản lý (`ADMIN`/`MASTER`) thực hiện ngoại lệ khi nhập lý do bắt buộc và lưu vào nhật ký.
11. **Sửa lỗi cắt ngắn phân trang (`src/utils/fetchAllPages.js`):**
    - Không dừng sớm khi `batch.length < pageSize`; tải trọn vẹn toàn bộ bản ghi (đã kiểm thử với 1.200 bản ghi và giới hạn máy chủ 100/trang).

## 2. Nâng cấp Kiến trúc FE & Trải nghiệm UI/UX (Mục tiêu 9–10/10)

- **Dashboard chuyên biệt theo vai trò (`DashboardPage.jsx`):**
  - **Admin:** Bổ sung bảng **Theo dõi ngoại lệ cần lưu ý** (chuyển khoản chờ đối soát, hóa đơn quá hạn đóng, hồ sơ thiếu SĐT/ngày sinh) có liên kết xử lý 1 chạm.
  - **Huấn luyện viên:** Bổ sung nút **Điểm danh** nhanh ngay trên từng buổi dạy sắp tới.
  - **Võ sinh:** Bổ sung nút **Xin nghỉ** trực tiếp từ danh sách buổi tập sắp tới.
- **Biên nhận thu học phí chuẩn in (`ReceiptPrintModal.jsx` + `ux-polish.css`):**
  - Hỗ trợ xem trước và in biên nhận chính thức (`@media print` ẩn thanh điều hướng, giữ bố cục sạch sẽ trên giấy A4/A5).
- **Khả năng tiếp cận (Accessibility) & Responsive Mobile (`ux-polish.css`):**
  - Chuẩn hóa đường viền `:focus-visible` tương phản cao cho cả giao diện Sáng và Tối (Dark Navy), bổ sung nút **Xem chi tiết** dùng được bằng bàn phím trên từng dòng bảng, và tối ưu hiển thị trên màn hình nhỏ (`<= 768px`).
- **Đóng gói sạch cho Windows:** Loại bỏ thư mục lồng thừa `Frontend/Frontend` (v1.0.0 cũ) và loại bỏ `node_modules`/`dist` khỏi tệp ZIP bàn giao.

## 3. Hướng dẫn chạy kiểm thử trên máy Windows

```bash
npm ci
npm test
npm run build
npm run dev
```
