import { ALL_ROLES as all, action } from "../../shared/config/roles.js";
export default {
  id: "notifications",
  title: "Thông báo cá nhân",
  group: "Điều hành",
  icon: "bell",
  roles: all,
  list: "GET /notifications/me",
  columns: ["templateCode", "payload", "channel", "createdAt", "readAt"],
  actions: [action("Đánh dấu đã đọc", "PATCH /notifications/{id}/read", all)]
};
