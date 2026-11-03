import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';
import { modules } from '../../../routes/routeConfig.js';
import { ROLES, ACTIONS } from '../../../utils/permissions.js';
import { IS_MOCK, api } from '../../../services/api.js';
import { useRemote } from '../../../hooks/useRemote.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import Button from '../../../components/common/Button.jsx';
export default function PermissionMatrix() {
  const remote = useRemote(() => api.request('/permissions'));
  const { refreshPermissions } = useAuth(),
    toast = useToast();
  const [editing, setEditing] = useState(false),
    [role, setRole] = useState('MASTER'),
    [draft, setDraft] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  useEffect(() => {
    if (remote.data) setDraft(remote.data.matrix);
  }, [remote.data]);
  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.request('/permissions', {
        method: 'PATCH',
        body: { matrix: draft },
      });
      await refreshPermissions();
      toast('Đã cập nhật ma trận phân quyền.');
      setEditing(false);
      remote.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (remote.loading) return <Loading />;
  if (remote.error)
    return <ErrorState error={remote.error} retry={remote.reload} />;
  const roles = remote.data.roles;
  return (
    <section className="panel permission-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">KIỂM SOÁT TRUY CẬP</span>
          <h2>Ma trận phân quyền</h2>
          <p>
            Quyền ban đầu theo bảng nghiệp vụ. Chỉ quản trị viên có thể điều
            chỉnh.
          </p>
        </div>
        {IS_MOCK&&<Button
          variant="secondary"
          onClick={() => {
            setEditing((v) => !v);
            setDraft(remote.data.matrix);
            setError(null);
          }}
        >
          <ShieldCheck size={16} />
          {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa quyền'}
        </Button>}
      </div>
      <div className="permission-legend">
        {Object.entries(ACTIONS).map(([key, label]) => (
          <span key={key}>
            <b>{key}</b>
            {label}
          </span>
        ))}
      </div>
      {editing && (
        <div className="permission-edit-toolbar">
          <label>
            Vai trò cần chỉnh sửa{' '}
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option value={r.code} key={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={save} disabled={busy}>
            <Save size={15} />
            {busy ? 'Đang lưu…' : 'Lưu phân quyền'}
          </Button>
        </div>
      )}
      {error && <ErrorState error={error} />}
      <div className="table-scroll">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Chức năng</th>
              {editing
                ? Object.values(ACTIONS).map((label) => (
                    <th key={label}>{label}</th>
                  ))
                : roles.map((r) => <th key={r.id}>{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                {editing
                  ? Object.keys(ACTIONS).map((action) => (
                      <td key={action}>
                        <input
                          type="checkbox"
                          disabled={busy || (m.id==='discounts'&&(['E','D','P'].includes(action)||action==='C'&&role!=='INSTRUCTOR'||action==='A'&&!['ADMIN','MASTER'].includes(role))) || (m.id==='exam-results' && action==='A' && role!=='ADMIN')}
                          title={m.id==='exam-results' && action==='A' && role!=='ADMIN' ? 'Chỉ Admin được duyệt kết quả thi' : undefined}
                          aria-label={`${m.title} · ${ACTIONS[action]}`}
                          checked={Boolean(
                            draft[m.id]?.[role]?.includes(action),
                          )}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [m.id]: {
                                ...prev[m.id],
                                [role]: e.target.checked
                                  ? (prev[m.id]?.[role] || '') + action
                                  : (prev[m.id]?.[role] || '').replace(
                                      action,
                                      '',
                                    ),
                              },
                            }))
                          }
                        />
                      </td>
                    ))
                  : roles.map((r) => (
                      <td key={r.id}>
                        {draft[m.id]?.[r.code] ? (
                          <span className="permission-code">
                            {draft[m.id][r.code].split('').join(' · ')}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
