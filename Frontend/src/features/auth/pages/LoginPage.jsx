import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import AuthLayout from '../../../components/layout/AuthLayout.jsx';
import LoginForm from '../components/LoginForm.jsx';
import Loading from '../../../components/common/Loading.jsx';
export default function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen label="Đang kiểm tra phiên đăng nhập…" />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span>
        <h2>Đăng nhập hệ thống</h2>
        <p>Tiếp tục hành trình cùng Vovinam.</p>
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
