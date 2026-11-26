# Bản sửa frontend 2.3.3 — 26/11/2026

Áp dụng lên `Frontend(20261126-070011).zip`. Gói mới có một thư mục `Frontend`, giữ cây chức năng đang sử dụng; bỏ bản nguồn lồng và node_modules khỏi gói phân phối, dựng lại dist từ nguồn hiện tại.

| Mục review | Thay đổi |
|---|---|
| F01 | Sửa các biến chưa khai báo trong portal võ sinh, sửa tên lớp khi in; tách nhánh võ sinh/quản lý để không thay đổi thứ tự hooks khi role thay đổi. |
| F02 | Modal render footer; nút thu tiền mặt, tạo lịch lặp, in biên nhận hoạt động; busy khóa X/Escape. |
| F03 | Điều hướng danh sách nằm trên bảng, mặc định 50 dòng; thích ứng khi API giới hạn thấp hơn số dòng yêu cầu. Không thêm thanh phân trang cuối bảng. |
| F04 | Một bản nguồn 2.3.3, một lockfile và dist mới; không đóng gói source lồng/node_modules/chunk build cũ. |
| F05 | Docker dùng Nginx template nhận API_PROXY_TARGET/API_PROXY_PATH; bỏ trả 503 cố định và host backend hardcode. |
| F06 | README dùng đúng mật khẩu fixture 123; test tạo tài khoản mới dùng mật khẩu đủ mạnh riêng với seed. |
| F07 | Thêm ESLint chặn biến chưa khai báo; sửa các test lệch giao diện/fixture, giữ kiểm tra nghiệp vụ và tăng các ca regression. Kiểm tra export theo khóa bí mật, thêm sentinel để phát hiện rò rỉ giá trị. |
| F08 | Tải danh sách nhiều trang phải đủ tổng số bản ghi; trùng ID, đổi tổng, hết trang sớm hoặc chạm giới hạn phải báo lỗi. |
| F09 | Tải đủ các trang đối soát và giao dịch; lỗi tải được báo ra thay vì biến thành danh sách rỗng. |
| F10 | Hàng hồ sơ/thu phí hỗ trợ focus, Enter/Space; điều khiển con giữ thao tác riêng. |
| F11 | Bộ lọc hóa đơn đồng bộ lại khi URL thay đổi mà không remount. |
| F12 | Thông báo chứa ID hóa đơn/yêu cầu cụ thể; portal và màn hình hóa đơn mở đúng chi tiết, đóng xóa query tương ứng. Hỗ trợ liên kết record cũ. |
| F13 | Lịch lặp tải đủ lịch cũ, báo lỗi và cho thử lại; giữ từng buổi thất bại; retry không tạo lại buổi đã thành công; cảnh báo thay đổi chưa lưu. |
| F14 | Form ngày dùng helper lấy ngày địa phương, không cắt ngày UTC. |
| F15 | Script khởi tạo được chuyển ra boot.js cùng origin; CSP có allowlist QR_IMAGE_ORIGINS; ảnh QR lỗi có thông báo và phương án dùng thông tin ngân hàng. |
| F16 | Bảng tài chính chỉ render một trang mỗi lần, giữ đủ dữ liệu cho tổng/xuất. Tách hook điều hướng danh sách và deep link dùng chung; hỗ trợ password manager bằng username/current-password. |

Ngoài các mục review: sửa khởi tạo ma trận phân quyền để không hiển thị checkbox/bật nút lưu trước khi draft đã nhận dữ liệu server; chờ danh sách vai trò khởi tạo xong trước khi mount ma trận để tránh thay key và mất lần chỉnh đầu tiên. Ca kiểm tra xác nhận cả response PATCH và quyền thực tế sau khi lưu.

## Kết quả kiểm tra

- ESLint: đạt.
- Bộ kiểm thử: 186/186 đạt, không bỏ qua ca nào.
- Build production: đạt.
- Hợp đồng API: 31 module, 103 đường dẫn, 166 operation, 140 schema; đạt kiểm tra đồng bộ.

## Khởi chạy

Node.js >=22.12:

```bash
npm ci
npm run dev
```

Đăng nhập dữ liệu phát triển theo README. Tích hợp HTTP: `npm run dev:api`; cần backend thật hoặc fixture HTTP bằng `npm run mock:server` trong terminal khác.

Kiểm tra đầy đủ:

```bash
npm run check
node scripts/generate-handoff.mjs --check
```

`npm run check` lần lượt chạy lint, test và build production. Gói này kèm dist HTTP mới; `npm start` cần bật gateway và trỏ tới backend như README. `docs/validation/fixes-2.3.3-check.log` và `fixes-2.3.3-contract.json` là bằng chứng của bản này; những log ở phiên bản trước được giữ để tham khảo lịch sử.

## Phạm vi kiểm chứng và cấu hình cần có

- Kiểm thử DOM/HTTP dùng fixture server. Đã bổ sung ca kiểm tra nút cuối của dialog, busy/Escape, chuyển hết danh sách bị cap, thử lại lịch lặp, timezone Việt Nam, deep link hóa đơn, URL filter và gateway/CSP.
- Trình duyệt kiểm tra không kết nối được localhost ở môi trường này, nên không khẳng định đã nghiệm thu responsive/độ tương phản/tốc độ trên điện thoại thật.
- Docker/Nginx chưa được chạy trong môi trường kiểm tra vì không có Docker/Nginx. Cấu hình template được cung cấp cùng hướng dẫn, cần thử với backend và network triển khai của bạn.
- Khai báo origin HTTPS thực tế của nhà cung cấp QR bằng QR_IMAGE_ORIGINS nếu ảnh khác origin. Không mở quyền chạy script ngoài để xử lý QR.
- Tổng tài chính vẫn được tính từ snapshot tải đủ ở FE vì chưa có endpoint tổng hợp sản phẩm được xác nhận. Render bảng đã được giới hạn; với dữ liệu vận hành rất lớn nên bổ sung tổng hợp và export phía backend theo contract riêng.
- Các file legacy ở cây nguồn cũ được giữ để không tự ý xóa cấu trúc không liên quan. Kiểm tra import graph bảo đảm các entry legacy được nêu trong review không tham gia app đang chạy.
- Backend sản phẩm, DB dùng chung, transaction nhiều máy, ngân hàng/webhook, email và đo hiệu năng trên thiết bị thật cần nghiệm thu cùng hệ thống thực tế. Không có backend giả được đưa vào làm backend sản phẩm.
