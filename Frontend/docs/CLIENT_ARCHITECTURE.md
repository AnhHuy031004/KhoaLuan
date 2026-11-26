# Kiến trúc FE bàn giao

- `src/main.jsx`, `src/App.jsx`, `src/routes/`: một entry, một router, lazy page registry cho 31 module.
- `src/contexts/AuthContext.jsx`: nhận phiên/quyền từ API, trạng thái đơn vị, đăng xuất/hết phiên; không đổi ma trận sang một API cũ khi bật HTTP.
- `src/features/*`: trang và cấu hình nghiệp vụ. Các trang không kiểm tra chế độ mock để đổi luồng hoặc ẩn chức năng API.
- `src/services/api.js`: điểm chọn transport duy nhất. Development fixtures tách rõ; production mặc định HTTP và không fallback.
- `src/services/providers/apiProvider.js`: gọi endpoint canonical, thêm phạm vi từ URL, kiểm tra envelope danh sách/lookup/permissions/report và thông báo thay đổi sau ghi. Dữ liệu ngoài FE cập nhật qua focus/visibility/poll 30 giây khi phiên còn hợp lệ.
- `src/services/httpClient.js`: JSON/bearer/timeout/abort/refresh single-flight; giữ lỗi BE cho form. Không lưu dữ liệu nghiệp vụ production trong localStorage.
- `src/services/resourceService.js` + `writeDto.js`: tạo request CRUD/action và chuyển kiểu số, chỉ gửi trường ghi của form; bỏ password rỗng khi PATCH.
- `src/components/common/`: list, form, detail, workflow dialog, trạng thái tải/lỗi/rỗng và xuất danh sách.
- `src/config/uiPolicy.js`, `workflows.js`: trạng thái/bộ lọc và chuyển trạng thái dùng chung.
- `src/hooks/useListFilters.js`: URL/navigation; `src/styles/product.css`: bố cục/responsive/focus/theme sản phẩm.
- `contracts/`, `scripts/generate-handoff.mjs`: OpenAPI/Postman/module map tạo từ source; kiểm tra stale contract bằng --check.
- `mock/`, `tools/mock-server.mjs`: fixtures tham chiếu phát triển/kiểm thử; không phải backend triển khai và không có trong bundle production.
- `tests/fixtures/legacy-source/`: các nguồn API cũ chỉ để giữ kiểm thử lịch sử, không phải chuẩn BE và không được app import.

Đã dọn 62 file JS/JSX/JSON không nằm trong đồ thị import hoặc kiểm thử; 19 file chỉ dùng bởi test lịch sử được chuyển khỏi `src`. Chi tiết ở `SOURCE_LAYOUT.json`. Không đóng gói node_modules, dist cũ hoặc một frontend lồng bên trong frontend.
