import React, { useState } from "react";
import { api } from "../../../services/api/index.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useLookups } from "../../../shared/providers/LookupProvider.jsx";
import { useRemote } from "../../../shared/hooks/useRemote.js";
import { Loading, ErrorState, DataView, OperationDialog } from "../../../shared/components/index.jsx";
export function Security() {
  const {
    expire
  } = useAuth();
  const {
    lookups
  } = useLookups();
  const [action, setAction] = useState(null);
  const state = useRemote(signal => api.request("/auth/mfa/methods", {
    signal
  }), [false]);
  const actions = [["Đổi mật khẩu", "POST /auth/change-password"], ["Đổi email", "POST /auth/change-email/request"], ["Xác nhận email mới", "POST /auth/change-email/confirm"], ["Bắt đầu bật xác thực TOTP", "POST /auth/mfa/totp/enable"], ["Xác nhận bật TOTP", "POST /auth/mfa/totp/verify"], ["Kiểm tra mã TOTP", "POST /auth/mfa/totp/validate"], ["Tắt TOTP", "POST /auth/mfa/totp/disable"]];
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CÁ NHÂN</span>
          <h1>Bảo mật tài khoản</h1>
          <p>Mật khẩu, email và xác thực hai bước.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Phương thức xác thực</h2>
        {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <DataView data={state.data} />}
        <div className="actions">
          {actions.map(([title, key]) => <button key={key} className="secondary" onClick={() => setAction({
          title,
          key
        })}>
              {title}
            </button>)}
        </div>
        <p className="quiet-note">
          Bật TOTP gồm hai bước: quét QR bằng ứng dụng xác thực, sau đó xác nhận
          bằng mã TOTP. Lưu các mã khôi phục tại nơi riêng tư.
        </p>
      </section>
      {action && <OperationDialog key={action.key} action={action} lookups={lookups} onClose={() => setAction(null)} onComplete={state.reload} />}
    </>;
}
