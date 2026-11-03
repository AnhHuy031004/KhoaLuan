import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./auth";
import { api, IS_MOCK } from "./api";
import { operation, packBody, resolveSchema } from "./api/schema";
import { SchemaFields, ErrorState } from "./components";
const modes = {
  login: ["Đăng nhập", "Tiếp tục hành trình cùng Vovinam.", "POST /auth/login"],
  register: [
    "Tạo tài khoản",
    "Đăng ký tài khoản võ sinh trưởng thành hoặc phụ huynh.",
    "POST /auth/register",
  ],
  forgot: [
    "Quên mật khẩu",
    "Nhận liên kết khôi phục qua email.",
    "POST /auth/forgot-password",
  ],
  reset: [
    "Đặt lại mật khẩu",
    "Nhập mã từ email và mật khẩu mới.",
    "POST /auth/reset-password",
  ],
  verify: [
    "Xác minh email",
    "Nhập mã xác minh trong liên kết email.",
    "POST /auth/verify-email",
  ],
  resend: [
    "Gửi lại email xác minh",
    "Nhập email tài khoản bạn đã đăng ký.",
    "POST /auth/resend-verification",
  ],
  "confirm-email": [
    "Xác nhận email mới",
    "Nhập mã gửi tới địa chỉ email mới.",
    "POST /auth/change-email/confirm",
  ],
};
export default function AuthPage() {
  const { user, login, verifyMfa } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  const current = location.pathname.split("/").pop(),
    mode = modes[current] ? current : "login";
  const [values, setValues] = useState(() => ({
      token: new URLSearchParams(location.search).get("token") || "",
    })),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [success, setSuccess] = useState(""),
    [mfa, setMfa] = useState(null),
    [code, setCode] = useState(""),
    [show, setShow] = useState(false);
  if (user) return <Navigate to="/app/dashboard" replace />;
  const [title, subtitle, key] = modes[mode];
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess("");
    try {
      if (mfa) {
        await verifyMfa({ mfaToken: mfa, code });
        navigate("/app/dashboard");
      } else if (mode === "login") {
        const d = await login({
          email: values.email,
          password: values.password,
        });
        if (d.mfaRequired) setMfa(d.mfaToken);
        else navigate("/app/dashboard");
      } else {
        const body = packBody(operation(key).body, values);
        if (
          (mode === "register" || mode === "reset") &&
          (!/[A-Za-z]/.test(body.password) ||
            !/\d/.test(body.password) ||
            body.password.length < 8)
        )
          throw Error("Mật khẩu cần ít nhất 8 ký tự, có chữ và số.");
        const response = await api.request(operation(key).path, {
          method: "POST",
          body,
          public: true,
        });
        setSuccess(IS_MOCK && (response.mockToken || response.mockVerificationToken)
          ? `Mã mô phỏng (không gửi email): ${response.mockToken || response.mockVerificationToken}` :
          mode === "register"
            ? "Đã gửi yêu cầu đăng ký. Kiểm tra email xác minh trước khi đăng nhập."
            : "Yêu cầu đã được xử lý. Vui lòng kiểm tra email hoặc đăng nhập lại.",
        );
        setValues((v) => ({ ...v, password: "" }));
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-identity">
        <Link to="/auth/login" className="brand">
          <img
            className="brand-logo"
            src="/assets/vovinam-logo.png"
            alt="Logo Vovinam"
            width="48"
            height="48"
          />
          <strong>Vovinam</strong>
        </Link>
        <div className="auth-hero">
          <span className="eyebrow">KỶ LUẬT · BẢN LĨNH · NHÂN ÁI</span>
          <h1>
            Vững võ đạo.
            <br />
            Sáng tương lai.
          </h1>
          <p>
            Không gian quản lý và kết nối
            <br />
            cộng đồng Vovinam.
          </p>
        </div>
        <span className="auth-motto">
          <ShieldCheck size={16} />
          Rèn luyện hôm nay. Tự tin ngày mai.
        </span>
      </section>
      <section className="auth-content">
        <div className="auth-card">
          <span className="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span>
          <h2>{mfa ? "Xác thực hai bước" : title}</h2>
          <p>
            {mfa ? "Nhập mã từ ứng dụng xác thực hoặc mã khôi phục." : subtitle}
          </p>
          <form onSubmit={submit}>
            {mfa ? (
              <label>
                Mã xác thực
                <input
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            ) : mode === "login" ? (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={values.email || ""}
                    onChange={(e) =>
                      setValues({ ...values, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Mật khẩu
                  <span className="password-wrap">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={values.password || ""}
                      onChange={(e) =>
                        setValues({ ...values, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShow((v) => !v)}
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
              </>
            ) : (
              <SchemaFields
                schema={resolveSchema(operation(key).body)}
                values={values}
                onChange={setValues}
              />
            )}
            {error && <ErrorState error={error} />}
            {success && (
              <div className="success-note" role="status">
                {success}
              </div>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "Đang xử lý…" : mfa ? "Xác thực" : title}
              <ArrowRight size={16} />
            </button>
          </form>
          {mfa ? (
            <button
              className="text-button"
              onClick={() => {
                setMfa(null);
                setError(null);
              }}
            >
              Quay lại đăng nhập
            </button>
          ) : (
            <div className="auth-links">
              {mode === "login" ? (
                <>
                  <Link to="/auth/forgot">Quên mật khẩu?</Link>
                  <Link to="/auth/register">Tạo tài khoản</Link>
                </>
              ) : (
                <Link to="/auth/login">Quay lại đăng nhập</Link>
              )}
              <Link to="/auth/verify">Xác minh email</Link>
              <Link to="/auth/resend">Gửi lại email</Link>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
