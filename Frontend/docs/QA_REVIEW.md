# Rà soát thay đổi và xử lý phát hiện

So sánh mã nguồn đầu vào (commit nội bộ `3ebd75c`) với bản sửa. Đây là rà soát kỹ thuật bổ sung, không thay thế nghiệm thu người dùng.

## Standards

Không phát hiện vi phạm cứng của tài liệu quy ước repository. Ba vấn đề chức năng trong vòng review được sửa và thêm test: trường võ sinh bị xóa khi chọn lại lớp, bộ lọc lớp cũ khi đổi phạm vi, và guard override hóa đơn không nhất quán. Hai heuristic bảo trì đã được cải thiện bằng tách identity/database; xử lý CRUD chính vẫn còn tập trung.

## Spec

Năm khoảng trống phát hiện trong vòng review đều đã sửa: override phải có lý do cả khi fallback phí lớp; sửa tài khoản admin đồng bộ hồ sơ võ sinh; đổi đơn vị xóa bộ lọc con; form đề xuất bảo vệ bản nháp; tab vắng sau chốt không khẳng định ai cũng có mặt. Bổ sung ca hồi quy API/DOM cho các thay đổi liên quan. Không phát hiện phạm vi bổ sung gây thay đổi nghiệp vụ ngoài yêu cầu.

Số phát hiện ban đầu: Standards 3 chức năng + 2 heuristic, Spec 5 khoảng trống. Các điều kiện ngoài source FE và cảnh báo dev dependency còn mở được ghi ở FIX_STATUS/PRODUCTION_ACCEPTANCE, không gộp thành trạng thái đã xong.
