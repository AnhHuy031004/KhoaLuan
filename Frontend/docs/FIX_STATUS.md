# Đối chiếu sửa lỗi — Vovinam 1.1.0

Ngày kiểm tra: 18/11/2026. Nguồn đầu vào: `Frontend(4).zip` và hai file Word tổng hợp (nội dung hai file Word giống nhau). Bản trích yêu cầu gốc nằm tại `REVIEW_REQUIREMENTS.txt`.

**Phạm vi đã sửa:** mã frontend, mock nghiệp vụ, kiểm thử, dependencies và gói phát hành. **Chưa phải chứng nhận vận hành thật:** không có mã backend/DB/ngân hàng trong ZIP đầu vào. Các điều kiện ngoài FE được liệt kê ở `PRODUCTION_ACCEPTANCE.md`.

## Các lỗi có mã trong Word

| Mã | Thay đổi đã thực hiện | Kiểm chứng |
| --- | --- | --- |
| F01 | Duyệt PASS luôn ghi lịch sử đúng lớp/kỳ thi; chỉ nâng khi cấp đai mới cao hơn, không hạ đai đang có | Hồi quy kết quả thi lịch sử; test duyệt một lần và thông báo |
| F02 | Chuyển lớp ghi `leftAt`; roster tính theo khoảng ngày hiệu lực; bổ sung ngày rời suy ra được từ lần phân lớp sau | Buổi cũ chưa mở vẫn có người đã chuyển; kiểm thử phạm vi/lịch sử |
| F03 | GET roster không lưu snapshot mới hoặc khóa lịch; buổi mở nhận thêm người hợp lệ; lịch chỉ khóa khi có bản ghi hoặc đã chốt | So sánh DB trước/sau xem; sửa lịch chưa điểm danh; thêm người sau xem |
| F04 | Hoàn tác trước chốt, quản lý hiệu chỉnh sau chốt có lý do, lưu before/after/actor/time; hiển thị và xuất lịch sử | Test lý do bắt buộc, chốt, hiệu chỉnh, quyền và idempotency |
| F05 | JSON hỏng/cấu trúc sai/version không hỗ trợ trả lỗi, giữ nguyên raw; thêm backup/restore có checksum và xác nhận | Hồi quy giữ nguyên dữ liệu; kiểm tra backup bị sửa và backup hợp lệ |
| F06 | Một thư mục nguồn, không ZIP lồng, không node_modules Windows; build lại dist từ nguồn hiện tại; footer version/build | Cài sạch theo lockfile, test, build; kiểm tra cấu trúc ZIP |
| F07 | Seed dùng `Vovinam123!`, khớp README và test; DB cũ giữ mật khẩu đã lưu | Toàn bộ test đăng nhập/đổi/khôi phục mật khẩu chạy trực tiếp |
| F08 | Kiểm tra ngày/giờ; chặn chồng giờ theo lớp/HLV/địa điểm, trừ lịch hủy; mẫu mới không trùng | Test lịch trùng, cùng HLV/địa điểm và giờ không trùng |
| F09 | Dùng helper identity chung để đồng bộ liên hệ tài khoản ↔ hồ sơ, cả admin sửa user và tự sửa hồ sơ; chặn trùng email tài khoản | Hồi quy hai chiều, đổi tên/email/phone và kiểm tra trùng |
| F10 | Một hàm nguồn giá đúng lớp/kỳ, fallback phí lớp; preview miễn giảm/phải thu dùng cùng hàm tính; override bắt buộc lý do và Admin | Test biểu phí 490.000, fallback, miễn giảm, quyền override, hóa đơn đã phát hành |
| FE01 | Xác nhận thanh toán lọc SUCCESS; bỏ bộ pill trùng dropdown | DOM test đổi PENDING → SUCCESS và mở chi tiết |
| FE02 | Danh sách trạng thái riêng theo module; live mode lấy enum từ hợp đồng API, không xổ 29 trạng thái chung | Test cấu hình và số lựa chọn thực tế |
| FE03 | SUCCESS luôn có nghĩa Đã xác nhận dù thiếu thông tin người duyệt; thiếu actor không thành Từ chối | Test hàm nhãn và chi tiết giao dịch thiếu reviewer |
| FE04 | Sau chốt, tab Vắng chỉ ABSENT; EXCUSED thuộc Có phép; chung điều kiện đếm/lọc | Test PRESENT/ABSENT/EXCUSED |
| FE05 | Dòng/checkbox chỉ chọn; các nút ghi nhận đi qua cùng xác nhận; có hoàn tác rõ | DOM test chọn không ghi DB, chỉ xác nhận mới ghi |
| FE06 | Tìm không khớp báo đúng nguyên nhân; tab vắng rỗng sau chốt không khẳng định ai cũng có mặt | Test tìm không khớp và kiểm tra nhánh trạng thái rỗng |

## Các cải thiện giao diện và kỹ thuật còn lại trong báo cáo

| Nhóm | Đã làm | Giới hạn cần lưu ý |
| --- | --- | --- |
| Phạm vi đơn vị | Header đổi đơn vị, trang hiển thị dòng ngắn; đơn vị HLV/võ sinh không là link giả; đổi phạm vi xóa bộ lọc con cũ | Trang Điều hành vẫn có cây đơn vị vì đó là nhiệm vụ chính của trang |
| Dashboard/menu | Nội dung theo vai trò, việc chờ xử lý có số lượng, lịch/thông báo/shortcut kiểm tra quyền; nhóm menu quản trị thu gọn | Số chờ xử lý tải từ API/mock, có báo lỗi nếu không tải được |
| Thuật ngữ/hành động | Dùng Võ sinh; nút có chữ; xóa trong Thao tác khác; batch ghi rõ số được chọn hoặc theo bộ lọc | Giữ những thuật ngữ nghiệp vụ riêng như HLV/Võ sư |
| Form | X/Escape/outside/Hủy kiểm tra dirty; khóa đóng khi lưu; beforeunload/link bảo vệ form chung và đề xuất; lỗi ô nhập, focus ô sai đầu; chọn phụ thuộc | Nút Back của trình duyệt trong SPA vẫn cần nghiệm thu trực tiếp; không khẳng định mọi luồng API tùy biến đã có cùng guard |
| Tiền/hồ sơ dài | Ô số kèm tiền định dạng đồng, preview phí/giảm/phải thu; nhóm thông tin cá nhân/học tập/liên hệ | Ô nhập giữ số nguyên để tránh sai cách phân tách; kiểm tra layout trên thiết bị thật |
| Chi tiết | Thứ tự trường theo cấu hình, không duyệt mọi thuộc tính raw; tách RecordDetail/WorkflowDialog khỏi trang danh sách | Trường nghiệp vụ mới cần bổ sung vào cấu hình |
| Bộ lọc/điều hướng | URL giữ tìm kiếm/trạng thái/lớp/tháng/trang; điểm danh giữ ngày/buổi/tab/từ khóa; một lần đổi bộ lọc tạo một lịch sử điều hướng | Tìm kiếm dùng replace để không tạo lịch sử cho mỗi ký tự |
| Xuất file | Danh sách lọc lấy đủ trang; xuất toàn hệ thống có xác nhận; worker, Map lookup và kiểm tra dữ liệu thiếu/lặp | Không phải snapshot giao dịch nhiều máy; backend cần export job/snapshot riêng |
| Thông báo | Mở đúng bản ghi nghiệp vụ; đọc từng thông báo có lỗi phản hồi; live adapter ánh xạ endpoint PATCH read | Payload/link và endpoint thật cần nghiệm thu với backend |
| Mobile | Thẻ điểm danh và hóa đơn ở màn hẹp, nút thao tác dễ chạm; bảng khác cố định cột nhận diện | Chưa hoàn thành kiểm tra trực quan trên trình duyệt thật |
| Lịch/404/theme | Đổi tên Dạng thẻ đúng thực tế; 404 có quay lại/tổng quan; Sáng/Tối/Hệ thống/Galaxy; bỏ màn chờ đầu vào | Không bổ sung website giới thiệu hoặc lịch tháng khi chưa có yêu cầu nội dung |
| Hiệu năng/kiến trúc | Cache DB theo raw, invalidate khi tab khác đổi; gom subscription; worker Excel; tách database/identity/pricing/dialogs | CRUD chính vẫn tập trung trong mock/api.js; backend thật cần transaction/cache riêng |
| Backup | Admin tải/khôi phục JSON; DB hỏng có lối khôi phục, không tự reset | Demo chứa mật khẩu rõ; file backup phải giữ riêng tư |

## Kết quả kiểm chứng

- Cài lại sạch bằng `npm ci --ignore-scripts` theo lockfile.
- `npm test`: xem kết quả chính xác trong `VERIFICATION.json` và `validation/tests.log`; không skip test.
- `npm run build`: đạt; `npm run build:live -- --outDir dist-live`: đạt. Gói bàn giao chỉ chứa dist demo, tránh hai bản chạy lẫn nhau. Live build được kiểm tra không có tài khoản/mật khẩu/seed demo.
- Test giao diện dùng React DOM + JSDOM: bộ lọc và Back, dialog dirty/busy, form thi/hóa đơn, chọn điểm danh, tìm rỗng, võ sinh đổi lớp chọn lại, đổi scope, form đề xuất, dashboard ba vai trò, popup giao dịch và checksum backup.
- Test worker chạy ở thread riêng, trả buffer XLSX đọc lại được. Workbook giữ kiểu số/text và không biến chuỗi giống công thức thành công thức.
- Benchmark dữ liệu giả: 10.000 dòng khoảng 285 ms, XLSX 843.473 byte, RSS 124 MiB; 100.000 dòng khoảng 3.964 ms, XLSX 8.339.684 byte, RSS 460 MiB. Đo trên Node v24.22.3 của môi trường sửa, không phải số đo điện thoại hoặc cam kết hiệu năng trình duyệt.
- Chromium trong môi trường hiện tại không khởi chạy được do hạn chế socket. Không có kết quả nghiệm thu pixel, tương phản, screen reader, LCP/INP/CLS hoặc tải đồng thời nhiều máy. DOM test không thay thế các kiểm tra này.

## Dependencies và các mục chưa thể đóng

Đã thay SheetJS 0.18.5 bằng gói chính thức 0.20.3, nâng Vite trong nhánh 7 và plugin React tương thích, cập nhật lockfile. `npm audit --omit=dev` không báo advisory cho dependency runtime tại thời điểm kiểm tra.

`npm audit` đầy đủ **vẫn báo 4 package high** thuộc chuỗi build/dev `picomatch`, `fdir`, `tinyglobby`, `vite`; cùng một nguyên nhân picomatch, không phải 4 vụ khai thác riêng. Bản picomatch 4.0.7 mới nhất mà registry trả về trong lần sửa vẫn nằm trong dải advisory GHSA-fc5q-39xc-vjpf. Không hạ Vite sang nhánh cũ hoặc dùng `audit fix --force` để che cảnh báo. Dev server bind localhost; chỉ build mẫu glob tin cậy, không phục vụ dev server công khai; theo dõi bản vá upstream. Đây là mục còn mở, không được coi là đã xử lý triệt để.

Các mục backend dùng chung, băm mật khẩu, phục hồi email thật, thanh toán ngân hàng, transaction/audit server, giám sát và nghiệm thu thiết bị được đánh dấu rõ trong `PRODUCTION_ACCEPTANCE.md`. Cần mã nguồn/quyền môi trường tương ứng để triển khai; sửa FE không thể tự hoàn thành các điều kiện này.
