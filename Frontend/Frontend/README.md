# Vovinam — Hệ thống quản lý lớp võ (Chế độ Live API)

Hệ thống hiện được **kích hoạt mặc định ở chế độ Live API** kết nối tới máy chủ backend `https://vovinamapinode.onrender.com` (tài liệu Swagger/OpenAPI tại `https://vovinamapinode.onrender.com/docs`, tiền tố API `/api/v1`).

## 1. Cấu hình kết nối API đã kích hoạt

- **Biến môi trường (`.env`, `.env.example`, `.env.production.example`)**:
  ```env
  VITE_USE_MOCK=false
  VITE_API_BASE_URL=/backend
  API_PROXY_TARGET=https://vovinamapinode.onrender.com
  ```
- **Reverse Proxy đồng nhất (`/backend` -> `https://vovinamapinode.onrender.com/api/v1`)**:
  - **Vite Dev Server (`vite.config.js`)**: Tự động proxy `/backend` sang `https://vovinamapinode.onrender.com/api/v1` khi `VITE_USE_MOCK !== 'true'`.
  - **Node Production Server (`server.mjs`)**: Bật mặc định reverse proxy `/backend` sang `https://vovinamapinode.onrender.com/api/v1` (timeout 45s phù hợp với cold-start trên Render).
  - **Nginx (`nginx.conf`)**: Đã cấu hình `proxy_pass https://vovinamapinode.onrender.com/api/v1/;` kèm SNI (`proxy_ssl_server_name on`).
- **Tương thích toàn diện các màn hình trên Live API (`src/services/live/liveAdapter.js`, `src/services/live/livePolicy.js`)**:
  - Đồng bộ ma trận phân quyền theo 4 vai trò của máy chủ API (`ADMIN`, `INSTRUCTOR`, `STUDENT`, `PARENT`).
  - Màn hình **Điểm danh buổi tập** (`ApiAttendancePage`) kết nối trực tiếp `POST /attendance-sessions` và `GET/POST /attendance-sessions/{id}/records`.
  - Màn hình **Thanh toán online & Xác nhận tiền mặt** (`ApiPaymentsPage`) kết nối trực tiếp `POST /payments/qr/{invoiceId}` và `POST /payments/{invoiceId}/confirm-cash`.
  - Màn hình **Mã khuyến mãi** (`/app/discounts`) tự động chuyển sang CRUD mã khuyến mãi của API (`GET/POST /discounts`, `PATCH/DELETE /discounts/{id}`) khi chạy ở chế độ API.
  - Bốn màn hình **Báo cáo trực quan bằng biểu đồ** (`student-report`, `attendance-report`, `tuition-report`, `promotion-report`) tổng hợp trực tiếp từ dữ liệu API thực tế qua bộ điều hợp `/report-charts/*`.
  - Bản dựng sẵn trong thư mục `dist/` đã được biên dịch ở chế độ Live API để có thể chạy ngay với `npm start`.

## 2. Cách chạy ứng dụng

### Chạy môi trường phát triển (Vite Dev Server)
```bash
npm ci
npm run dev
```

### Chạy bản dựng Production (Node Reverse Proxy + Static Server)
```bash
npm start
```
Mở `http://localhost:4173`. Khi cần biên dịch lại trên máy của bạn:
```bash
npm run build
npm start
```

### Chuyển lại chế độ Dữ liệu mẫu (Mock Mode) khi cần kiểm thử ngoại tuyến
Nếu muốn chạy thử nghiệm ngoại tuyến bằng dữ liệu mẫu cục bộ, đặt `VITE_USE_MOCK=true` trong `.env` và khởi động lại Vite (`npm run dev`).

## 3. Kiểm thử tự động

```bash
npm test
```
Toàn bộ 116 bài kiểm thử tự động (bao gồm kiểm thử HTTP client, xoay vòng refresh token, ánh xạ DTO OpenAPI, `liveAdapter`, biểu đồ báo cáo và các luồng nghiệp vụ) đều đạt 100%.
