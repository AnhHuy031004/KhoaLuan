# Vovinam — Frontend bàn giao Backend 2.1.0

FE quản lý Vovinam gồm **31 module**, cây Tỉnh → Phường → CLB → Lớp và các vai trò Admin, Võ sư, HLV, Võ sinh. Giao diện dùng cùng các trang, form, quyền và luồng xử lý ở cả HTTP lẫn môi trường phát triển. Không có banner demo, nút khôi phục DB trình duyệt hoặc màn hình thay thế khi bật API.

**Bắt đầu bàn giao:** [docs/BE_HANDOFF.md](docs/BE_HANDOFF.md). Hợp đồng API chuẩn: [contracts/openapi.json](contracts/openapi.json). Đây là hợp đồng mục tiêu cho BE triển khai; không dùng các snapshot API cũ trong bộ test làm chuẩn tích hợp.

## Giao diện 2.1.0

Giao diện quản trị mặc định sáng, sidebar xanh đậm, điều hướng có tìm kiếm không dấu và nhóm chức năng mở sẵn. Dashboard phân tách số liệu, thao tác nhanh, việc chờ xử lý và lịch tập. Bảng giữ nút thao tác ở mép phải; trên màn hình nhỏ chuyển thành thẻ có nhãn. Biểu mẫu chia nhóm rõ ràng, trạng thái lỗi/focus và cảnh báo chưa lưu được giữ nguyên. Menu điện thoại hỗ trợ bàn phím, Escape và khóa tương tác nền.

Chi tiết thay đổi và tiêu chí nghiệm thu: [docs/UI_REDESIGN.md](docs/UI_REDESIGN.md). Bản 2.1.0 giữ hợp đồng API 2.0.0 để BE tiếp tục tích hợp.

## Xem và thử FE trước khi BE hoàn thành

Cần Node.js 22.12 trở lên. Mở terminal trong thư mục `Frontend`:

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị. Chế độ phát triển dùng dữ liệu kiểm thử riêng để thử đủ màn hình và thao tác. Mật khẩu mẫu: **Vovinam123!**.

| Vai trò | Tài khoản phát triển |
| --- | --- |
| Admin tỉnh | admin@vovinam.test |
| Võ sư tỉnh | vosu@vovinam.test |
| Võ sư phường | vosuphuong@vovinam.test |
| Võ sư CLB | vosuclb@vovinam.test |
| HLV | hlv@vovinam.test |
| Võ sinh | vosinh@vovinam.test |

Nếu đã đổi mật khẩu trong fixtures của bản trước, mật khẩu đã đổi vẫn được giữ. Có thể dùng server fixture HTTP độc lập ở phần dưới để thử với dữ liệu phát triển mới mà không xóa dữ liệu cũ.

Các tài khoản này chỉ thuộc fixtures phát triển, không được tạo tự động trên BE. Không dùng dữ liệu cá nhân thật trong môi trường fixtures. Dữ liệu fixtures chỉ phục vụ phát triển, không có trong bundle production.

## Kết nối BE bằng HTTP

```bash
npm run dev:api
```

Mặc định FE gọi `/backend`; proxy local chuyển sang `http://127.0.0.1:3000/api/v1`. Để đổi máy chủ, tạo `.env.local`:

```dotenv
VITE_API_BASE_URL=/backend
API_PROXY_TARGET=http://127.0.0.1:3000
API_PROXY_PATH=/api/v1
```

Không đặt `VITE_USE_MOCK=true` trong `.env.local` nếu đang tích hợp BE. Có thể đặt `VITE_API_BASE_URL=https://api.ten-mien-cua-ban.vn/api/v1` để gọi trực tiếp; BE cần cấu hình CORS cho origin FE.

Nếu chưa có BE, mở terminal thứ hai và chạy `npm run mock:server`, rồi dùng `npm run dev:api` ở terminal thứ nhất. Đây là server fixture HTTP để kiểm tra tầng kết nối thật, không phải backend sản phẩm.

## Build bàn giao/triển khai

```bash
npm test
npm run build
npm start
```

`npm run build` mặc định tạo **FE dùng HTTP**, không chứa seed, tài khoản mẫu hay công cụ khôi phục cục bộ. `dist` trong gói này là bản build HTTP. Mở http://localhost:4173; không nhấp đúp `dist/index.html`.

Với `server.mjs`, cấu hình môi trường runtime để bật gateway API:

```dotenv
ENABLE_API_PROXY=true
API_PROXY_TARGET=http://127.0.0.1:3000
API_PROXY_PATH=/api/v1
```

Hoặc cấu hình Nginx/hosting chuyển `/backend/*` đến BE và SPA fallback về `index.html`. Không có máy chủ bên thứ ba được đặt sẵn trong source. Biến `VITE_*` là biến công khai lúc build, không dùng để chứa bí mật.

Nếu cần build riêng để trình diễn offline: `npm run build:fixtures` rồi `npm run preview:fixtures`. Thư mục này tách khỏi `dist` production và không được đóng gói chung như một bản phát hành thứ hai.

## Tài liệu và công cụ BE nhận được

- `contracts/openapi.json`: OpenAPI 3.1, request/response, mã lỗi, quyền và endpoint của các luồng.
- `contracts/postman_collection.json`: collection có body theo schema; điền biến môi trường/ID thật trước khi gọi.
- `contracts/example-responses.json`: mẫu JSON từ dữ liệu giả độc lập, không có token đăng nhập sử dụng được.
- `contracts/modules.json`: 31 route, trường form, trạng thái và quyền mặc định.
- `docs/API_ENDPOINTS.md`: tra cứu endpoint theo chức năng.
- `docs/BE_HANDOFF.md`, `UI_STATES.md`, `BUSINESS_RULES.md`: quy ước tích hợp và nghiệm thu.
- `tools/mock-server.mjs`: tham chiếu HTTP khi phát triển.
- `tests/handoff-api.test.js`, `tests/handoff-ui.test.js`: kiểm tra hợp đồng và giao diện qua HTTP.

## Kiểm tra hợp đồng

```bash
npm run contract:generate
node scripts/generate-handoff.mjs --check
npm run test:contract
```

Sau khi thay module/form/workflow phải tạo lại hợp đồng và thống nhất thay đổi với BE. Kết quả kiểm tra bản phát hành nằm trong `docs/VERIFICATION.json` và `docs/validation/`.
