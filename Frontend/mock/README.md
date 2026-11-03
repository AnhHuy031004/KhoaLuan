# Dữ liệu mock đang hoạt động

Mặc định VITE_USE_MOCK=true. users.js chứa 4 tài khoản, cùng mật khẩu Vovinam123!: admin@vovinam.test (ADMIN), vosu@vovinam.test (MASTER), hlv@vovinam.test (INSTRUCTOR), vosinh@vovinam.test (STUDENT).

Không MFA và không gọi API thật. seed.js ghép dữ liệu theo từng file chức năng. api.js xử lý kiểm tra mật khẩu, phiên, CRUD, phân trang, lọc và kiểm tra quyền bằng dữ liệu cục bộ. DB key vovinam-mock-offline-v4, session prefix v4:mock:. Đây là dữ liệu trình diễn, xác thực mock không bảo vệ tài nguyên trên máy chủ.
