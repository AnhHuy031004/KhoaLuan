export default {
  id: "payments",
  title: "Lịch sử giao dịch",
  group: "Tài chính",
  icon: "wallet",
  roles: ["ADMIN", "STUDENT", "PARENT"],
  list: "GET /payments",
  edit: "PATCH /payments/{id}",
  columns: ["orderRef", "gateway", "amount", "status", "paidAt"]
};
