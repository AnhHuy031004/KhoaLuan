# Bật API sau này

Hiện tại API không được khởi tạo. Chỉ mockProvider dùng createMockFetch; toàn bộ service UI giữ một interface api.request/read/save/clear.

1. Sao chép các giá trị trong `.env.api.example` sang `.env`, đặc biệt VITE_USE_MOCK=false.
2. Khởi động lại Vite hoặc build lại. Không chỉ sửa .env khi đang dùng bản dist cũ.
3. Dùng tài khoản tồn tại trên API, không dùng mock/users.js. API hiện có ADMIN, INSTRUCTOR, STUDENT, PARENT; MASTER chỉ thuộc mock. MFA của API nếu bật vẫn bắt buộc; mock không can thiệp tài khoản thật.
4. Vite tự bật proxy khi VITE_USE_MOCK=false. Với `npm start` sau build API, đặt ENABLE_API_PROXY=true trong môi trường chạy Node (PowerShell: `$env:ENABLE_API_PROXY="true"; npm start`). Có thể đặt API_PROXY_TARGET nếu đổi máy chủ. Node không tự nạp .env.
5. Với Docker/Nginx, chỉ khi dùng API mới thay nginx.conf bằng nginx.api.example.conf rồi build lại container; hoặc tự cấu hình reverse proxy.

Các file kết nối thật: src/services/providers/apiProvider.js, src/services/live/liveAdapter.js, livePolicy.js, liveContract.json; HTTP chung ở src/services/httpClient.js. Chúng được giữ để kết nối lại, không chạy ở bản mock. DTO và endpoint tham khảo docs/API_INTEGRATION.md.

Hai provider không chia sẻ phiên hay dữ liệu. Không có thao tác đồng bộ dữ liệu mock lên server.

Luồng điểm danh theo buổi mới hiện là hợp đồng mock /attendance-workflow/*; cần ánh xạ session/roster/present/close sang backend khi kết nối sau. Không gửi endpoint này lên API cũ. XLSX trong mock xuất từ /exports/system snapshot.
