import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Loading from '../common/Loading.jsx';
import ErrorState from '../common/ErrorState.jsx';
export default function ProtectedRoute() {
  const { user, loading, error, retry } = useAuth(),
    location = useLocation();
  if (loading) return <Loading fullScreen label="Đang kiểm tra phiên đăng nhập…" />;
  if (error) return <ErrorState error={error} retry={retry} />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  );
}
