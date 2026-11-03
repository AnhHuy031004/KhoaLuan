import { action } from "../../shared/config/roles.js";
export default {
  id: "children",
  title: "Võ sinh liên kết",
  group: "Gia đình",
  icon: "users",
  roles: ["PARENT"],
  list: "GET /parents/me/children",
  columns: ["fullName", "dob", "currentBeltRankId", "status"],
  topActions: [action("Liên kết bằng mã mời", "POST /parents/link", ["PARENT"])],
  remove: "DELETE /parents/links/{studentId}"
};
