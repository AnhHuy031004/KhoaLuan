import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import AuthLayout from '../../../components/layout/AuthLayout.jsx';
import LoginForm from '../components/LoginForm.jsx';
import Loading from '../../../components/common/Loading.jsx';

export default function LoginPage() {
  const { user, loading } = useAuth();
  if (loading)
    return <Loading fullScreen label="Đang kiểm tra phiên đăng nhập…" />;
  if (user) return <Navigate to="/app/dashboard" replace />;

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-tricolor" aria-hidden="true" />

        <div className="auth-card-header">
          <div className="auth-emblem-wrap">
            <span className="auth-emblem-halo" aria-hidden="true" />
            <img
              src="/assets/vovinam-logo.png"
              alt="Biểu trưng Vovinam Việt Võ Đạo"
              className="auth-emblem-img"
            />
          </div>
          <span className="eyebrow">TINH HOA VÕ VIỆT · CHÀO MỪNG TRỞ LẠI</span>
          <h2>Đăng nhập hệ thống</h2>
          <p>Rèn ý chí, vững bản lĩnh — tiếp tục hành trình cùng Vovinam.</p>
        </div>

        <LoginForm />

        <div className="auth-contact">
          Cần tài khoản hoặc hỗ trợ truy cập?
          <br />
          <strong>Liên hệ quản trị viên võ đường của bạn.</strong>
        </div>
      </div>
    </AuthLayout>
  );
}
