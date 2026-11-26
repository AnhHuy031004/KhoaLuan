# Cấu trúc frontend

- src/features/<chức-năng>/: cấu hình module, trang và thành phần của từng tính năng.
- src/components/: common (loading/form/modal/table), layout (sidebar/header), rbac (chặn tuyến theo quyền).
- src/contexts/: phiên đăng nhập, theme và toast.
- src/routes/: cấu hình chức năng và tuyến React Router.
- src/services/api.js: chọn provider theo môi trường, mặc định mock. UI chỉ gọi chung api.request/read/save/clear.
- src/services/providers/mockProvider.js: dùng mock/api.js, không dùng fetch mạng.
- src/services/providers/apiProvider.js: kết nối thật để dành; chỉ import/khởi tạo khi VITE_USE_MOCK=false.
- src/services/live/: adapter, DTO/permissions và OpenAPI snapshot cho lần ghép API sau.
- src/services/httpClient.js: interface HTTP chung, refresh token và lỗi; ở mock dùng fetch giả do provider cung cấp.
- mock/: từng file dữ liệu mẫu theo chức năng, users.js cho tài khoản; seed.js ghép DB, api.js thực thi các nghiệp vụ cục bộ.
- src/styles/: giao diện xanh tối, typography và animation/loading.
- public/assets/: logo và ảnh nền cục bộ.
- tests/: kiểm thử HTTP, live adapter để dành, nghiệp vụ mock.

DB localStorage key vovinam-mock-offline-v4; phiên mock sessionStorage prefix v4:mock:. API dùng vùng phiên riêng v3:api:. Không trộn dữ liệu hay fallback giữa hai chế độ. Xem README.md để chạy và docs/API_LATER.md để bật API sau này.

Điểm danh mới: mock/attendance-workflow.js (quyền, roster snapshot, xác nhận, chốt), features/attendance/pages/SessionAttendancePage.jsx, services/sessionAttendanceService.js. Excel: mock/export-system.js (snapshot toàn bộ phạm vi), services/export/systemExportService.js, utils/excelExport.js (workbook XLSX), components/common/ExportSystemButton.jsx.

Đơn xin nghỉ: reviewStatus.js/LeaveStatus.jsx hiển thị snapshot người xử lý; mock/api.js kiểm tra PENDING, khóa thay đổi đơn đã xử lý, migration quyền; mockProvider.subscribeLeaves cập nhật danh sách/popup giữa tab, Web Locks serialize đọc/ghi DB dùng chung.

## Thay đổi từ bản sửa 1.1.0

- `mock/database.js`: seed/migration, đọc/lưu và cache theo raw; `src/utils/demoDatabase.js`: kiểm tra cấu trúc trước migration/restore. GET thuần không stringify/lưu lại DB cuối request.
- `mock/identity.js`: đồng bộ liên hệ theo studentId/userId, dùng chung cho hồ sơ và tài khoản.
- `src/utils/tuition.js`: nguồn biểu phí và tính miễn giảm dùng chung cho preview/issuance mock; `mock/invoice-pricing.js` giữ export tương thích.
- `src/config/uiPolicy.js`: trạng thái theo module, nhãn hành động, liên kết thông báo, điều kiện lọc điểm danh.
- `src/hooks/useListFilters.js`: cập nhật URL theo một navigation/event, giữ Back/Forward và kết hợp reset trang.
- `src/components/common/RecordDetail.jsx` và `WorkflowDialog.jsx`: tách chi tiết/xác nhận duyệt khỏi trang danh sách.
- `src/services/providers/resourceEvents.js`: một bộ listener, gom burst thay đổi trước khi tải lại.
- `src/utils/exportWorker.js`: tạo workbook ngoài luồng UI; `FilteredExportButton.jsx`: xuất tập đang lọc, kiểm tra phân trang đầy đủ.
- `src/features/recovery/`: backup/restore demo có checksum và xác nhận thay dữ liệu; không phải backup backend.
- `src/styles/product.css`: bố cục gọn, biến theme sáng, responsive thẻ điểm danh/hóa đơn và focus rõ.

Các file App/Auth/service cũ không có bằng chứng sử dụng trong route hiện hành không được xóa hàng loạt. Gói phát hành loại bỏ bản Frontend lồng và dist cũ; kiến trúc active đi từ `src/main.jsx` → `src/App.jsx` → `src/routes/AppRoutes.jsx`.
