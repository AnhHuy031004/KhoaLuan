import React, { useState } from "react";
import { api } from "../../../services/api/index.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useLookups } from "../../../shared/providers/LookupProvider.jsx";
import { useRemote } from "../../../shared/hooks/useRemote.js";
import { Loading, ErrorState, DataView, OperationDialog } from "../../../shared/components/index.jsx";
export function Billing() {
  const {} = useAuth();
  const {
    lookups
  } = useLookups();
  const state = useRemote(signal => api.request("/admin/billing/settings", {
    signal
  }), [false]);
  const [action, setAction] = useState(null);
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TÀI CHÍNH</span>
          <h1>Cấu hình & chốt học phí</h1>
          <p>Học phí từng lớp và tài khoản ngân hàng nhận tiền.</p>
        </div>
      </div>
      <div className="actions mb">
        {[["Chốt học phí tháng", "POST /admin/billing/generate-monthly"], ["Cập nhật học phí từng lớp", "PUT /admin/billing/settings/tuition-rates"], ["Tài khoản ngân hàng", "PUT /admin/billing/settings/bank-account"]].map(([title, key]) => <button className="secondary" key={key} onClick={() => setAction({
        title,
        key
      })}>
            {title}
          </button>)}
      </div>
      <div className="warning-note">
        Cập nhật mức học phí thay thế toàn bộ bảng giá hiện có. Hãy nhập đủ các
        lớp cần giữ lại trước khi xác nhận.
      </div>
      <section className="panel">
        {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <DataView data={state.data} />}
      </section>
      {action && <OperationDialog key={action.key} action={action} lookups={lookups} onClose={() => setAction(null)} onComplete={state.reload} />}
    </>;
}
