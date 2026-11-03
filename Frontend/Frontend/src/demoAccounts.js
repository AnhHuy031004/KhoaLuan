// Public credentials for the read-only local demo; never sent to the API.
export const demoPassword = "Vovinam123!";
export const demoAccounts = [
  { email: "admin@vovinam.test", role: "ADMIN", label: "Quản trị viên" },
  { email: "hlv@vovinam.test", role: "INSTRUCTOR", label: "Huấn luyện viên" },
  { email: "vosinh@vovinam.test", role: "STUDENT", label: "Võ sinh" },
  { email: "phuhuynh@vovinam.test", role: "PARENT", label: "Phụ huynh" },
];
export function authenticateDemo({ email, password }) {
  const account = demoAccounts.find(a => a.email === String(email || "").trim().toLowerCase());
  if (!account || password !== demoPassword)
    throw Error("Email hoặc mật khẩu mẫu chưa đúng. Chọn tài khoản mẫu bên dưới để điền lại.");
  return account;
}
