import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { LookupProvider } from "../../shared/providers/LookupProvider.jsx";
import { Loading, ErrorState } from "../../shared/components/index.jsx";
import Layout from "../layouts/AppLayout.jsx";
export default function Guard() {
  const {
    user,
    booting,
    bootError,
    retryBoot,
    expire
  } = useAuth();
  if (booting) return <div className="startup">
        <Loading text="Đang xác nhận phiên đăng nhập…" />
      </div>;
  if (bootError) return <div className="startup">
        <ErrorState error={{
      message: bootError
    }} retry={retryBoot} />
        <button className="secondary" onClick={expire}>
          Xóa phiên trên máy này
        </button>
      </div>;
  return user ? <LookupProvider>
      <Layout />
    </LookupProvider> : <Navigate to="/auth/login" replace />;
}
