# Vovinam — bản mock độc lập

Mặc định chạy hoàn toàn bằng dữ liệu mẫu cục bộ. Không cần backend, tài khoản API, mạng Internet sau khi cài dependencies, hay mã MFA. Giao diện tối, ảnh nền, loading và animation được giữ nguyên.

## Phân cấp tổ chức mới

Cơ cấu **Tỉnh → Phường → Câu lạc bộ → Lớp**. Admin cấp tỉnh cấp tài khoản và chọn cấp quản lý, phường/câu lạc bộ phụ trách cho Võ sư. Có dữ liệu mẫu 2 phường, mỗi phường 2 câu lạc bộ, tổng cộng 6 lớp. Hướng dẫn và ma trận quyền tại `docs/ORGANIZATION_HIERARCHY.md`.

## Cập nhật điểm danh và Excel

Đã bỏ biểu tượng sao. Điểm danh theo ngày → buổi tập → tick học viên → Có mặt → Xác nhận → bổ sung người đến muộn → Chốt điểm danh buổi học. Mọi nút xuất tạo workbook XLSX chứa toàn bộ dữ liệu nghiệp vụ trong phạm vi quyền, không phụ thuộc bộ lọc/phân trang và không giới hạn 5.000 dòng. Xem `docs/ATTENDANCE_AND_EXCEL.md`.

## Gửi và duyệt đơn xin nghỉ

Học viên gửi và theo dõi đơn của mình; Admin/Võ sư/HLV xem và duyệt theo phạm vi quyền. Người đầu tiên xử lý được lưu vai trò, tên và thời điểm; đơn khóa với tất cả người còn lại. Các tab cùng trình duyệt tự đồng bộ, kể cả popup đang mở. Xem `docs/LEAVE_APPROVAL.md`.

## Chạy

Giải nén vào thư mục mới, mở terminal tại Frontend. Node.js 22.12 trở lên.

```bash
npm ci
npm run dev
```

Mở URL Vite hiển thị. Đăng nhập bằng email bên dưới, mật khẩu chung **Vovinam123!**:

| Vai trò | Email |
| --- | --- |
| Admin cấp tỉnh | admin@vovinam.test |
| Võ sư cấp tỉnh | vosu@vovinam.test |
| Võ sư cấp phường (Trấn Biên) | vosuphuong@vovinam.test |
| Võ sư phụ trách CLB Trung tâm | vosuclb@vovinam.test |
| Huấn luyện viên | hlv@vovinam.test |
| Võ sinh | vosinh@vovinam.test |

Chỉ cần email và mật khẩu, không yêu cầu mã xác thực. Form không tự điền hay hiển thị tài khoản thử trên giao diện.

## Dữ liệu và thư mục

- `mock/users.js`: tài khoản và phân quyền mẫu.
- `mock/`: seed riêng cho học viên, lớp, lịch, điểm danh, nghỉ học, đánh giá, thi/nâng đai, bảng điểm, học phí/hóa đơn, thanh toán, thông báo, báo cáo và nhật ký; `seed.js` ghép dữ liệu, `api.js` xử lý đăng nhập/CRUD/quyền.
- `src/features/`: từng chức năng riêng; `src/components/`: giao diện dùng chung.
- `src/services/providers/mockProvider.js`: provider mock đang dùng.
- `src/services/providers/apiProvider.js` và `src/services/live/`: phần API để dành, không khởi tạo khi dùng mock.

DB mẫu tự tạo ở lần mở đầu và lưu thay đổi trong localStorage với key `vovinam-mock-offline-v4`. Phiên mock lưu riêng trong sessionStorage prefix `v4:mock:`; phiên API cũ không dùng lại. Dữ liệu chỉ thuộc trình duyệt hiện tại, không đồng bộ giữa các máy. Muốn khởi tạo lại, xóa key DB này và các key `v4:mock:` trong DevTools > Application > Storage rồi tải lại trang.

## API để kết nối sau

`.env` mặc định `VITE_USE_MOCK=true`. Không tự fallback qua lại giữa mock/API. Khi chưa cấu hình biến này vẫn chọn mock. Proxy Vite/Node/Nginx mặc định không nối API thật. Hướng dẫn bật lại API ở `docs/API_LATER.md`. Các tài liệu API trước đây trong docs chỉ là tham chiếu cho giai đoạn sau.

## Build

```bash
npm test
npm run build
npm start
```

Mở http://localhost:4173. Không mở dist/index.html bằng cách nhấp đúp. Vite preview và hosting tĩnh cũng dùng được với bản mock; hosting cần rewrite mọi đường dẫn về index.html.

Chi tiết animation: `docs/LOADING_AND_MOTION.md`. Prompt ảnh nền: `docs/ASSETS.md`. Phân quyền hiện hành của mock nằm trong `src/routes/routeConfig.js` và có thể chỉnh bằng màn hình Ma trận phân quyền với tài khoản admin.

### Đề xuất thăng đai theo lớp (mock)
- Chọn lớp trước khi lập/xét đề xuất. HLV chỉ thấy lớp phụ trách; Admin và Võ sư được duyệt theo quyền `A` của module.
- Chọn từng dòng hoặc tất cả đề xuất chờ duyệt trên trang hiện tại (10 dòng), bấm **Duyệt tất cả / Từ chối tất cả**, kiểm tra danh sách rồi xác nhận. Nếu chưa tích chọn, hai nút xử lý tất cả đề xuất chờ duyệt của lớp theo bộ lọc hiện tại, gồm mọi trang; nếu có tích chọn, chỉ xử lý những tên đã chọn. Đổi lớp/bộ lọc/trang sẽ bỏ lựa chọn.
- Trạng thái lưu tên, vai trò, thời điểm xử lý. Đề xuất đã xử lý không thể duyệt lại/sửa/xóa. Các tab dùng chung dữ liệu mock tự đồng bộ.
- Tạo đề xuất yêu cầu võ sinh đang học đúng lớp, đai cao hơn hiện tại và chưa có đề xuất chờ duyệt. Duyệt đề xuất không tự cấp đai; kết quả thi vẫn là bước cập nhật đai.
- `POST /promotions/bulk-review` là hợp đồng **mock**, body `{classId, ids, action: "approve" | "reject"}`. Kiểm tra toàn bộ quyền, lớp và trạng thái trước khi ghi; lỗi 409 yêu cầu tải lại/chọn lại. API thật chưa được nối vào luồng này, cần ánh xạ hợp đồng khi tích hợp sau.
- Phân trang/tìm kiếm/chọn dòng nằm trong `src/features/promotions/pages/PromotionsPage.jsx`; service ở `services/promotionsService.js`; mẫu trong `mock/promotions.js`; quyền, kiểm tra và xử lý nguyên tử ở `mock/api.js`; giao diện ở `src/styles/promotions.css`.

### Kỳ thi và kết quả theo lớp (mock)
- Admin/Võ sư có quyền duyệt hoặc từ chối kỳ thi và kết quả qua các nút biểu tượng; HLV và học viên chỉ xem trong phạm vi được cấp.
- Kết quả thi mặc định chọn lớp đầu tiên; đổi lớp bằng dropdown. Tên lớp đang xem hiển thị phía trên bảng điểm; dữ liệu xuất Excel vẫn có trường Lớp học. Form chỉ liệt kê võ sinh của lớp đã chọn, kỳ thi đã duyệt.
- Kết quả lưu lớp tại thời điểm lập bảng điểm; chuyển lớp sau này không làm thay đổi lớp của kết quả cũ. Dữ liệu cũ tự bổ sung lớp một lần, không xóa dữ liệu.
- Duyệt kết quả yêu cầu chọn Đạt hoặc Chưa đạt; Đạt cập nhật đai và lịch sử một lần. Từ chối không cấp đai. Kỳ thi/kết quả đã xử lý không được sửa, xóa hoặc duyệt lại; lưu người xử lý, vai trò và thời điểm.
- API thật vẫn tách riêng; các thay đổi luồng đang chạy trên mock.

### Danh mục cấp đai của trung tâm
- Mẫu mặc định theo danh mục đã cung cấp: Lam đai, Lam đai I, Lam đai II, Hoàng đai. Hồ sơ, kỳ thi, đề xuất và xuất Excel dùng chung ID/tên từ danh mục.
- Cột cấp đai hiển thị nhãn với màu của danh mục. Ô chọn được sắp xếp theo thứ tự cấp đai; đổi tên/màu trong Danh mục sẽ cập nhật các màn hình dùng chung dữ liệu.
- Dữ liệu cũ có đúng mẫu Hồng đai mặc định sẽ được chuyển sang Hoàng đai và bỏ mục Hồng đai một lần; danh mục đã tùy chỉnh tên/nội dung được giữ lại. Không đặt lại học viên hay tài khoản.
- Chặn trùng tên/thứ tự, thứ tự phải là số nguyên dương; không được xóa cấp đai còn được tham chiếu trong dữ liệu nghiệp vụ.
- Hai bộ kiểm thử cũ `tests/api.test.js` và `tests/mock.test.js` trong ZIP tải lên còn dùng registry/exports cũ nên hiện có lỗi tương thích; các kiểm thử mới về danh mục và các luồng hiện hành đã chạy riêng thành công.

### Kết quả thi: chỉ Admin phê duyệt và tự thông báo (mock)
- Chỉ vai trò `ADMIN` được duyệt Đạt/Chưa đạt hoặc từ chối kết quả thi. Võ sư giữ quyền nhập/sửa điểm đang chờ; HLV và võ sinh xem theo quyền hiện có.
- Ràng buộc có ở nút giao diện, hàm kiểm tra quyền, xử lý mock và màn hình ma trận quyền. Dữ liệu cũ tự bỏ quyền A của các vai trò khác trong module Kết quả thi, không đặt lại dữ liệu.
- Sau khi xử lý thành công, tạo thông báo nội bộ trong chuông và trang Thông báo: Võ sư nhận kết quả, HLV nhận kết quả của lớp phụ trách, võ sinh chỉ nhận kết quả của mình. Người không liên quan không nhận thông báo.
- Thông báo chứa tên võ sinh, kỳ thi, lớp, kết quả và Admin xử lý; lưu trạng thái đọc riêng từng tài khoản. Các tab dùng chung dữ liệu mock được cập nhật qua sự kiện lưu trữ.
- Bản ghi đã chốt không xử lý lại; không cấp đai hoặc phát thông báo trùng. Thông báo hệ thống chỉ được xem, không sửa/xóa. Chưa gửi email/SMS và chưa nối backend thật.
- Kiểm tra liên quan: `node --test tests/admin-result-notifications.test.js tests/workflows.test.js tests/exams-class-results.test.js tests/leaves-review.test.js tests/promotions-review.test.js tests/rank-catalog.test.js`.

### Xem xét miễn giảm học phí
Trang `/app/discounts` thay Quản lý khuyến mãi bằng luồng xét đề xuất học phí. HLV chọn học viên đang học trong lớp phụ trách, tháng áp dụng, miễn 100% hoặc giảm từ trên 0 đến dưới 100%, kèm lý do.

HLV gửi đơn -> Admin và Võ sư nhận thông báo -> một trong hai người duyệt/từ chối -> lưu vai trò, họ tên và thời điểm xử lý -> HLV gửi đơn và tài khoản học viên nhận thông báo. Người còn lại chỉ xem trạng thái đã xử lý; thao tác trùng trả 409, không tạo thêm thông báo. Học viên chỉ xem đơn của mình. Đơn đã gửi không sửa/xóa; đơn bị từ chối có thể gửi lại.

Dữ liệu ở `db.tuitionRelief`, tạo mẫu bằng `mock/tuition-relief.js`; xử lý qua `/tuition-relief` (GET danh sách/chi tiết, POST tạo, POST `/:id/actions/approve|reject`). Đây là hợp đồng mock để nối backend sau. Dữ liệu khuyến mãi cũ vẫn được giữ phục vụ các hóa đơn trước đây; đề xuất đã duyệt được lưu để xét học phí, không tự sửa các hóa đơn đã lập/thanh toán.

Thông báo nội bộ nằm trong chuông và trang Thông báo; cập nhật giữa các tab, trạng thái đọc riêng từng tài khoản. Export toàn hệ thống bao gồm đơn miễn giảm và thông tin người duyệt theo quyền. Không gửi email/SMS. Kiểm tra luồng mới: `node --test tests/tuition-relief.test.js`.

### Bốn báo cáo bằng biểu đồ
- Báo cáo võ sinh: số lượng theo lớp, phân bố cấp đai, tình trạng học tập và hồ sơ mới theo tháng (ngày tạo hồ sơ).
- Báo cáo điểm danh: cơ cấu có mặt/đi muộn/vắng/nghỉ có phép, lượt có mặt và vắng theo lớp, xu hướng lượt theo tháng. Mỗi bản ghi điểm danh là một lượt.
- Báo cáo học phí: tổng hóa đơn, đã thanh toán, chưa thanh toán và quá hạn; biểu đồ cơ cấu số tiền, số tiền theo lớp/tháng thu và số hóa đơn theo trạng thái.
- Báo cáo thăng đai: lấy từ lịch sử cấp đai, gồm lượt được cấp, số võ sinh, cơ cấu đai và xu hướng theo tháng. Phân lớp dùng lớp hiện tại trong hồ sơ khi dữ liệu lịch sử chưa lưu lớp.
- Cả bốn trang dùng `src/components/reports/ReportsPage.jsx`, không hiển thị bảng danh sách; lọc lớp/tháng, tải lại, xử lý rỗng, ghi chú định nghĩa số liệu và giữ nút xuất toàn hệ thống XLSX.
- Số liệu được tổng hợp đầy đủ từ mock qua `GET /report-charts/:reportId` trong `mock/report-charts.js`; kiểm tra quyền báo cáo và phạm vi tài khoản ở bộ xử lý. Đây là hợp đồng tổng hợp sẵn cho backend sau, chưa kết nối API thật.
- Không giới hạn biểu đồ theo trang danh sách; các tháng trống giữa hai tháng có dữ liệu được điền 0. Kiểm thử bổ sung: `node --test tests/report-charts.test.js`.
