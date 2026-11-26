# Bàn giao FE ↔ BE — FE 2.1.0 / API 2.0.0

## Chuẩn tích hợp duy nhất

Entry ứng dụng là `src/main.jsx` → `src/App.jsx` → `src/routes/AppRoutes.jsx`. Toàn bộ trang dùng `src/services/api.js`; HTTP provider gọi thẳng hợp đồng canonical. Không còn live adapter đổi quyền/DTO/màn hình sang tập API cũ. Mã cũ chỉ còn trong `tests/fixtures/legacy-source` cho kiểm thử lịch sử, không được import bởi ứng dụng.

Hợp đồng chuẩn là `contracts/openapi.json` (OpenAPI 3.1). `contracts/modules.json` và `API_ENDPOINTS.md` được tạo từ cấu hình module hiện hành. Đây là yêu cầu cho BE tương thích, không phải tài liệu mô tả một máy chủ cũ đã có sẵn.

## Thứ tự ghép BE

1. Auth: login, refresh-token, me, logout; optional MFA challenge; profile/change-password và email reset.
2. Permissions và lookup: `/permissions`, `/lookups?module=...`, `/organization/navigation?module=...`; kiểm tra bốn vai trò và ba cấp Võ sư.
3. Tổ chức/hồ sơ/lớp/phân lớp/lịch; CRUD và ràng buộc ngày hiệu lực, sĩ số, chồng giờ.
4. Điểm danh theo buổi, xin nghỉ, đánh giá, đề xuất, kỳ thi, kết quả và lịch sử cấp đai.
5. Biểu phí, miễn giảm, hóa đơn, yêu cầu xác nhận thanh toán và giao dịch.
6. Dashboard, thông báo, bốn endpoint biểu đồ và snapshot xuất Excel.

Dùng Postman import collection, đặt `baseUrl`, `email`, `password`, các ID tham chiếu. Login lưu accessToken vào collection variable. Các body mẫu cần thay bằng dữ liệu thật trong môi trường BE.

## Envelope và HTTP

Thành công:

```json
{"code":200,"message":"Thành công","data":{"items":[],"total":0,"page":1,"limit":8}}
```

Lỗi từng trường:

```json
{"code":422,"message":"Vui lòng kiểm tra thông tin.","data":null,"errors":{"fullName":"Nhập họ tên.","classId":"Lớp không hợp lệ."}}
```

- HTTP status phải phản ánh kết quả. Không trả HTTP 200 cho thao tác thất bại; FE vẫn phòng vệ nếu `code >= 400` trong JSON.
- GET danh sách trả `{items,total,page?,limit?,lookups?,summary?}`; `total` là số bản ghi **sau lọc**, trước phân trang. Không đổi sang `rows`, `count` hoặc bọc thêm tầng `data` bên trong data.
- GET `/resource/{id}` trả một bản ghi có `id`, không trả Page hoặc danh sách không lọc. Bản ghi đã hoàn tất vẫn xem được theo quyền sở hữu để liên kết thông báo hoạt động.
- ID và khóa tham chiếu là chuỗi. Ngày nghiệp vụ `YYYY-MM-DD`, tháng `YYYY-MM`, giờ `HH:mm`; timestamp ISO 8601 có timezone. Số tiền là số nguyên VND. Điểm/% là số JSON, không phải chuỗi định dạng tiền.
- Với tài khoản không phải MASTER, FE bỏ masterLevel/wardId/clubId khỏi DTO; MASTER cấp tỉnh bỏ ward/club, cấp phường bỏ club. Khi đổi vai trò, BE xóa phạm vi không còn áp dụng thay vì giữ scope cũ.
- FE chuyển kiểu số khi gửi DTO; không gửi trường hiển thị như tên lookup, trạng thái duyệt hoặc provinceId tự chèn ngoài form. PATCH bỏ password rỗng để giữ mật khẩu cũ.
- Lỗi 401 chỉ dẫn đến refresh một lần, sau đó đăng xuất nếu phiên không hợp lệ; 403 giữ phiên và báo thiếu quyền. Không fallback sang dữ liệu mẫu khi HTTP lỗi.
- 409 báo trạng thái đã xử lý/trùng/xung đột; giữ thông tin cần đối chiếu, tải lại bản ghi khi phù hợp. Không retry mù các thao tác thu tiền/duyệt.
- `errors` có thể là object field → message/array hoặc array `{field,message}`. FE hiển thị tại ô, focus ô sai đầu và giữ bản nháp.

## Auth, quyền và phạm vi

- Header `Authorization: Bearer <accessToken>`; JSON login `{user,tokens:{accessToken,refreshToken}}`; refresh trả `{accessToken,refreshToken}`.
- Nếu MFA được bật, login trả `{mfaRequired:true,mfaToken}`; FE chuyển sang nhập mã và POST `/auth/mfa/login-verify`.
- Vai trò gốc: ADMIN, MASTER, INSTRUCTOR, STUDENT. MASTER có `masterLevel=PROVINCE|WARD|CLUB`, provinceId/wardId/clubId tương ứng; STUDENT có studentId.
- `/permissions` trả `{matrix,roles}`. Mã V/C/E/D/A/P lần lượt Xem/Thêm/Sửa/Xóa/Duyệt/Xử lý. Matrix dùng để hiển thị FE; BE vẫn kiểm tra từng request.
- Bộ lọc `wardId`, `clubId`, `classId`, `search`, `status`, `month`, `page`, `limit` là yêu cầu hiển thị, không phải bằng chứng quyền truy cập. Không cho đoán ID ngoài đơn vị.
- Tạo lớp ở cấp MASTER/CLUB không gửi `tuition`; BE áp dụng giá mặc định phù hợp và không cho cấp CLB tự đặt phí. Người có quyền thiết lập học phí vẫn phải cung cấp giá hợp lệ; đây là điều kiện theo danh tính phía BE, không suy từ body.
- `/lookups` luôn có arrays `students`, `classes`, `ranks` (rỗng nếu không có quyền/dữ liệu). Trả thêm các arrays theo form trong schema và danh sách `writableClassIds`, `writableStudentIds` khi muốn giới hạn lựa chọn ghi.
- `/organization/navigation` trả cây toàn bộ phần người dùng được quản lý; việc đang xem CLB nào không được làm mất các CLB khác mà người dùng được phép chuyển tới.
- Scope lưu theo userId, xóa trạng thái đơn vị khi đăng xuất; bỏ qua response hierarchy cũ sau đổi tài khoản. HLV/võ sinh không nhận lại danh sách đơn vị của quản lý trước đó.
- Người dùng tùy biến quyền khi đang mở trang: kiểm tra lại quyền ở BE; FE tải quyền qua focus/refresh định kỳ và sau các thao tác liên quan.

## Các endpoint cần response riêng

- GET `/promotions`: page phải có `lookups` (classes/students/ranks) để màn xét đề xuất dùng được ngay.
- GET `/attendance-workflow/dates`, `/sessions?date=...`, `/sessions/{id}`: xem schema AttendanceSession. GET chỉ xem, không khóa lịch. POST present/close/undo/correct theo quyền/trạng thái; trả lại roster đầy đủ.
- GET `/dashboard`: các trường đếm và arrays trong schema Dashboard; số liệu đã theo phạm vi/ownership. FE tải số chờ duyệt bằng các endpoint tương ứng.
- GET `/report-charts/{reportId}`: cards/charts/classes/recordCount/note/generatedAt; chart hỗ trợ `bar`/`bars`, `line`, `donut`; chart data dùng `{id,name,value,color?}`. Màu vắng mặt được FE thay bằng palette mặc định.
- GET `/notifications`: array, không phải page. Metadata workflowModule/workflowRecordId hoặc resultId/reliefId để mở đúng bản ghi; `read` riêng từng người.
- GET `/exports/system`: snapshot đầy đủ trong quyền, không có mật khẩu/token/session; FE tạo workbook trong worker. Với dữ liệu rất lớn có thể thống nhất job xuất phía server trong phiên bản contract sau.

## Chạy kiểm tra qua HTTP khi chưa có BE

```bash
npm run mock:server
npm run dev:api
```

Server fixture chỉ bind loopback, dùng dữ liệu giả trong bộ nhớ. Dùng cùng source FE, không đổi màn hình, không ghi DB nghiệp vụ vào trình duyệt ở HTTP mode. Có thể thay server này bằng BE thật giữ nguyên URL/payload.

Sau khi BE triển khai, chạy các ca trong `BUSINESS_RULES.md` và `UI_STATES.md` trên môi trường ghép thực tế. FE bàn giao đã kiểm tra với fixture HTTP; chưa có bằng chứng rằng backend thật của dự án đã hoàn thành các endpoint này.
