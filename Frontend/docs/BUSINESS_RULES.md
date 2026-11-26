# Ràng buộc nghiệp vụ BE cần thực thi

Các quy tắc dưới đây đã có luồng FE và ca kiểm thử tham chiếu; BE phải kiểm tra lại trong transaction, không tin trạng thái/nút bị ẩn trên FE.

| Nghiệp vụ | Quy tắc và kết quả cần giữ |
| --- | --- |
| Danh tính | Liên kết userId/studentId; tên/email/phone đồng bộ tài khoản ↔ hồ sơ. Khóa tài khoản không đồng nghĩa xóa lịch sử học. Chặn trùng email danh tính |
| Phạm vi | Tỉnh → Phường → CLB → Lớp; HLV chỉ lớp phụ trách, võ sinh chỉ dữ liệu mình; kiểm tra ID lẫn query. Cấp CLB không có quyền tài chính bị chặn trên BE |
| Phân lớp | Chặn trùng phân lớp đang học/sĩ số đầy. Chuyển ghi ngày rời và ngày vào; buổi cũ theo khoảng hiệu lực, không theo lớp hiện tại đơn thuần |
| Lịch | Ngày/giờ hợp lệ; chặn chồng giờ cùng lớp/HLV/địa điểm, trừ lịch hủy; buổi chỉ xem chưa bị khóa; có điểm danh thực tế hoặc đã chốt mới bảo vệ lịch |
| Điểm danh | GET không ghi snapshot mới; OPEN nhận thêm người hợp lệ; CLOSED giữ snapshot. Trước chốt có undo kèm lý do; sau chốt chỉ quản lý có quyền được correct; audit before/after/user/time/reason |
| Xin nghỉ | PENDING → APPROVED/REJECTED đúng một lần. Đơn duyệt sau chốt không tự viết lại lịch sử; quản lý hiệu chỉnh có lý do |
| Đề xuất | Võ sinh đang học đúng lớp, đai đề xuất cao hơn hiện tại, chưa có đề xuất PENDING. Duyệt đề xuất chưa cấp đai; batch nguyên tử theo một lớp |
| Kỳ thi/kết quả | Chỉ kỳ thi được duyệt mới nhập kết quả. Bảng điểm giữ lớp tại thời điểm lập; chỉ Admin duyệt PASS/FAIL hoặc từ chối kết quả. PASS ghi lịch sử một lần, không hạ đai hiện tại khi duyệt kết quả cũ |
| Miễn giảm | HLV/Võ sư/Admin đề xuất; cấp trên hợp lệ duyệt. EXEMPTION=100%; REDUCTION >0 và <100%; không cộng chồng hai ưu đãi theo cách thu sai |
| Biểu phí | Một mức ACTIVE cho lớp/kỳ; lấy đúng kỳ rồi phí lớp mặc định. FE gửi amount số nguyên; khác mức cấu hình cần lý do và Admin. Hóa đơn đã phát hành không tự đổi theo biểu phí mới |
| Hóa đơn | Unique võ sinh/lớp/kỳ; khóa sửa/xóa khi thanh toán hoặc có yêu cầu chờ ảnh hưởng số tiền; miễn giảm áp dụng khi lập/sửa hợp lệ |
| Xác nhận thu | DRAFT → PENDING → SUCCESS/REJECTED. Đối chiếu khoản thu thực tế trước SUCCESS; cùng transaction cập nhật hóa đơn PAID và tạo một giao dịch; chống duyệt/ghi giao dịch trùng |
| Thông báo | Chỉ gửi người liên quan, trạng thái đọc riêng tài khoản, metadata mở đúng bản ghi, không sửa/xóa thông báo hệ thống |
| Quyền/phiên | Băm mật khẩu, token refresh/thu hồi, MFA nếu bật, email reset token một lần có hạn. Không trả password/token bí mật trong danh sách/lookups/exports |
| Retry/đồng thời | Dùng unique constraint/version/idempotency ở BE; 409 cho bản ghi đã xử lý; không thu tiền/cấp đai lặp khi request timeout hoặc nhiều người xử lý |

Luồng thanh toán trong FE là quản lý yêu cầu và kết quả xác nhận. Frontend không tự xác minh ngân hàng; BE/cổng thanh toán hoặc người có quyền phải đối chiếu trước khi trả SUCCESS. Nếu dự án cần QR/cổng thanh toán/chứng từ tải lên, thống nhất endpoint và UI bổ sung theo một phiên bản contract riêng; không lấy dữ liệu giả làm bằng chứng đã thu tiền.
