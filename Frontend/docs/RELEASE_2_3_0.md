# Báo cáo Nâng cấp Hệ thống Quản lý Vovinam — Phiên bản 2.3.0

## 1. Các hạng mục hoàn thiện trong bản 2.3.0 (tiếp nối đầy đủ v2.2.0)

1. **Tái cấu trúc mô-đun Frontend (giảm phình file & sửa phạm vi state):**
   - Tách `OnlinePaymentsPage.jsx` (1.398 dòng → **485 dòng**) thành các component độc lập:
     - `src/features/online-payments/components/SimulatedQrSvg.jsx`
     - `src/features/online-payments/components/StudentOnlineTuitionPortal.jsx`
     - `src/features/online-payments/components/ReceiptPrintModal.jsx`
   - Tách hộp thoại thao tác điểm danh ra `src/features/attendance/components/AttendanceActionModal.jsx`.
   - Dọn sạch 4 tệp legacy không còn tham chiếu (`src/styles.css`, `src/SpecialPages.jsx`, `src/Dashboard.jsx`, `src/components.jsx`) và loại bỏ thư mục lồng cũ `Frontend/Frontend` khi đóng gói.
2. **Nâng cấp UX vận hành cho từng vai trò:**
   - **Võ sinh (`StudentOnlineTuitionPortal.jsx`):** Hiển thị trực tiếp **lý do từ chối (`reviewNote`)**, **người xử lý**, **thời gian gửi**, **cấp đang đối soát (`reviewerHint`)** ngay trên thẻ khoản học phí, đồng thời bổ sung nút **Xem & In biên nhận** cho từng hóa đơn đã hoàn tất.
   - **Quản lý / Kế toán (`OnlinePaymentsPage.jsx`):** Bổ sung cột **Biên nhận** với nút **In** trên từng dòng hóa đơn đã nhận tiền, kết nối trực tiếp `ReceiptPrintModal`.
   - **Huấn luyện viên (`SessionAttendancePage.jsx`):** Bổ sung nút liên kết nhanh **Đơn nghỉ** ngay tại dòng võ sinh vắng mặt hoặc có phép để đối chiếu đơn xin nghỉ 1 chạm.
   - **Tạo lịch tập lặp theo tuần (`SchedulesPage.jsx` + `RecurringScheduleModal.jsx` + `src/utils/recurringSchedule.js`):** Chọn lớp, thứ trong tuần (T2–CN), số tuần lặp (1–16), xem trước danh sách buổi, tự phát hiện và bỏ qua buổi trùng giờ trước khi lưu.
3. **Tinh chỉnh UI (Light & Dark Navy WCAG, Responsive & Print):**
   - Bổ sung quy chuẩn tương phản cho chữ phụ, khung cảnh báo từ chối và đường viền trên nền Dark Navy trong `src/styles/ux-polish.css`, tối ưu hiển thị trên mobile (`<= 768px`) và bản in `@media print`.
4. **Kiểm thử mở rộng (`tests/upgrade-v23.test.js`):**
   - Kiểm thử thuật toán sinh lịch lặp, phát hiện trùng lịch, chặn dữ liệu ngày/giờ sai, tạo hàng loạt qua API, cùng xác minh kiến trúc sạch và kết nối UI/UX mới.

## 2. Hướng dẫn chạy nghiệm thu trên máy Windows

```bash
npm ci
npm test
npm run build
npm run dev
```
