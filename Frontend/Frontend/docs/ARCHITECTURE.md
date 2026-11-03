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
