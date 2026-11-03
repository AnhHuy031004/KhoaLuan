import { ALL_ROLES as all } from "../../shared/config/roles.js";
export default {
  id: "attendance-history",
  title: "Lịch sử điểm danh",
  group: "Đào tạo",
  icon: "calendar",
  roles: all,
  list: "GET /students/{id}/attendance",
  studentPath: true,
  columns: ["sessionDate", "className", "status", "note"]
};
