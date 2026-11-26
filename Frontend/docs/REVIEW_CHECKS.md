# Rà soát bản FE bàn giao BE

So sánh bản 1.1.0 và bản 2.0.0 theo yêu cầu: giữ một FE hoàn chỉnh cho BE tích hợp, bỏ giao diện công cụ demo, có hợp đồng API nhất quán.

## Standards

Bốn nhóm phát hiện đã được xử lý: request tạo lớp theo cấp quản lý; response score/report phù hợp schema; trạng thái đơn vị theo danh tính/response chậm; màu biểu đồ không bắt buộc có fallback. Đã thêm kiểm tra JSON Schema, luồng đổi tài khoản và trả lời HTTP. Heuristic còn lại: phụ thuộc giữa các resource/workflow được mô tả ở vài nơi; hiện có các ca hồi quy để kiểm tra luồng chính.

## Spec

Bốn nhóm khoảng trống đã được xử lý: bỏ field quản lý không áp dụng trong DTO tài khoản; schema/mẫu biểu đồ nhất quán; loading/lỗi thông báo không giả thành rỗng; schema lỗi chấp nhận object và array như tài liệu. Không ghi nhận phạm vi bổ sung làm thay đổi mục tiêu bàn giao.

Kiểm tra schema còn giúp phát hiện GET chi tiết trong fixture đang trả page. Đã sửa trả đúng bản ghi theo quyền, bổ sung xác nhận notification thanh toán mở bản ghi đã hoàn tất bằng route hợp lệ theo vai trò.

Các kiểm tra trên là kiểm tra source, DOM và HTTP; không thay thế nghiệm thu pixel/thiết bị thật hoặc nghiệm thu BE sau tích hợp.
