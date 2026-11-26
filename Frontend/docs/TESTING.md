# Kiểm tra bàn giao

```bash
npm ci
npm test
npm run test:contract
node scripts/generate-handoff.mjs --check
npm run build
```

- Kiểm thử hiện hành về nghiệp vụ/quyền/lịch sử/Excel tiếp tục chạy; test lịch sử API cũ được đặt cùng fixture nguồn cũ, không làm thay đổi API provider sản phẩm.
- `handoff-api.test.js`: gọi HTTP thật đến fixture server, đọc các module theo bốn vai trò, kiểm tra roster/quyền/profile/hóa đơn, lỗi không fallback và JSON DTO đúng kiểu.
- `handoff-ui.test.js`: render toàn bộ 31 trang Admin qua HTTP, thêm luồng võ sinh/quản lý/login/reset và lỗi từng trường. Không có DB nghiệp vụ trong localStorage ở HTTP mode, không có banner/công cụ demo trên các màn.
- `ui-flows.test.js`: kiểm tra form/dialog/dirty/bộ lọc/điểm danh/dashboard trong development fixtures.
- `export-worker.test.js`: workbook được tạo ở thread riêng, chuyển buffer và đọc lại được.
- Dùng AJV 2020 + ajv-formats kiểm tra response của các module qua HTTP, toàn bộ JSON mẫu, DTO theo vai trò và hai dạng lỗi từng trường với schema OpenAPI.
- `contract:generate --check`: bảo đảm tài liệu không lệch module/form/workflow; mọi schema reference được kiểm tra.

Build production được kiểm tra không có mockProvider/seed/tài khoản phát triển/RecoveryTools/banner demo trong assets. Đường dẫn SPA và gateway API được kiểm tra bằng HTTP.

Bản 2.1.0: 162/162 test đạt. Có test bổ sung cho menu mở sẵn, tìm kiếm, giữ trạng thái nhóm, bảng có nhãn trên mobile, ngày sinh để trống, focus trap và Escape của menu điện thoại.

Đã kiểm tra trực quan bằng Chrome ở viewport desktop 1366px và iframe rộng 390px: dashboard, danh sách võ sinh, form, menu điện thoại, chế độ tối, điểm danh và báo cáo. Các fixture QA chỉ dùng tạm tại workspace, không đi kèm source/dist bàn giao. JSDOM không có bộ máy layout; iframe không thay thế thử nghiệm thiết bị thật. Tiếp tục nghiệm thu theo UI_STATES.md và với BE sau khi ghép. Không dùng số lượng test hoặc build thành công để khẳng định mọi backend thật đã tương thích.

Kết quả `npm audit` đầy đủ và `npm audit --omit=dev` ngày 19/11/2026 đều trả 0 advisory trong các báo cáo đính kèm. Khác biệt với báo cáo 1.1.0: [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) được GitHub đánh dấu withdrawn ngày 18/11/2026. Picomatch vẫn là 4.0.7; không coi thay đổi số đếm này là bằng chứng đã cài một bản vá. Tiếp tục theo dõi upstream và kiểm tra lại sau thay đổi dependency; không dùng audit fix --force để che báo cáo.
