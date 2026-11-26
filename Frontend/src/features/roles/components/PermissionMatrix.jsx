import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';
import { modules } from '../../../routes/routeConfig.js';
import { ACTIONS } from '../../../utils/permissions.js';
import { api } from '../../../services/api.js';
import { useRemote } from '../../../hooks/useRemote.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import Button from '../../../components/common/Button.jsx';

const GROUPS = [
  'TỔ CHỨC',
  'ĐÀO TẠO',
  'THI & THĂNG ĐAI',
  'TÀI CHÍNH',
  'ĐIỀU HÀNH',
  'BÁO CÁO',
  'HỆ THỐNG',
];

export default function PermissionMatrix() {
  const remote = useRemote(() => api.request('/permissions'));
  const { refreshPermissions, user } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState('MASTER');
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (remote.data?.matrix) {
      setDraft(remote.data.matrix);
    }
  }, [remote.data]);

  const isAdmin = user?.role === 'ADMIN';
  const isDirty = useMemo(() => {
    if (!remote.data?.matrix) return false;
    return JSON.stringify(draft) !== JSON.stringify(remote.data.matrix);
  }, [draft, remote.data]);

  useEffect(() => {
    if (!isDirty) return;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [isDirty]);

  const visibleModules = useMemo(
    () => modules.filter((m) => !m.hiddenInNav),
    [],
  );

  const actionKeys = Object.keys(ACTIONS);

  function isActionDisabled(moduleId, action) {
    if (!isAdmin || busy) return true;
    if (
      moduleId === 'discounts' &&
      (['E', 'D', 'P'].includes(action) ||
        (action === 'C' &&
          !['ADMIN', 'MASTER', 'INSTRUCTOR'].includes(role)) ||
        (action === 'A' && !['ADMIN', 'MASTER'].includes(role)))
    ) {
      return true;
    }
    if (moduleId === 'exam-results' && action === 'A' && role !== 'ADMIN') {
      return true;
    }
    return false;
  }

  function togglePermission(moduleId, action, checked) {
    setDraft((prev) => {
      const current = prev[moduleId]?.[role] || '';
      const next = checked
        ? current.includes(action)
          ? current
          : current + action
        : current.replaceAll(action, '');
      return {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [role]: next,
        },
      };
    });
  }

  function toggleRowAll(moduleId, checked) {
    setDraft((prev) => {
      let next = prev[moduleId]?.[role] || '';
      for (const action of actionKeys) {
        if (isActionDisabled(moduleId, action)) continue;
        if (checked) {
          if (!next.includes(action)) next += action;
        } else {
          next = next.replaceAll(action, '');
        }
      }
      return {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [role]: next,
        },
      };
    });
  }

  async function save() {
    if (!isAdmin || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.request('/permissions', {
        method: 'PATCH',
        body: { matrix: draft },
      });
      await refreshPermissions();
      toast('Đã lưu cập nhật phân quyền cho các vai trò.');
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

  const roles = remote.data?.roles || [];

  return (
    <section className="panel permission-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">KIỂM SOÁT TRUY CẬP</span>
          <h2>Phân quyền theo vai trò</h2>
          <p>
            Chọn từng vai trò và tích chọn trực tiếp các chức năng được phép
            thao tác.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isDirty && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setDraft(remote.data.matrix);
                  setError(null);
                }}
              >
                <RotateCcw size={15} />
                Khôi phục
              </Button>
            )}
            <Button onClick={save} disabled={busy || !isDirty}>
              <Save size={15} />
              {busy ? 'Đang lưu…' : 'Lưu phân quyền'}
            </Button>
          </div>
        )}
      </div>

      {/* Role Selector Tabs */}
      <div className="perm-role-tabs">
        <div className="perm-role-list" role="tablist" aria-label="Chọn vai trò phân quyền">
          {roles.map((r) => (
            <button
              type="button"
              key={r.id}
              role="tab"
              aria-selected={role === r.code}
              className={`perm-role-btn ${role === r.code ? 'is-active' : ''}`}
              onClick={() => setRole(r.code)}
            >
              <ShieldCheck size={15} />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          Đang cấu hình quyền cho:{' '}
          <strong style={{ color: 'var(--heading)' }}>
            {roles.find((r) => r.code === role)?.name || role}
          </strong>
        </span>
      </div>

      {error && <ErrorState error={error} />}

      <div className="table-scroll">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Chức năng</th>
              <th className="perm-checkbox-cell">Tất cả</th>
              {actionKeys.map((key) => (
                <th key={key} className="perm-checkbox-cell">
                  {ACTIONS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.filter((g) =>
              visibleModules.some((m) => m.group === g),
            ).map((group) => (
              <React.Fragment key={group}>
                <tr className="perm-group-row">
                  <td colSpan={actionKeys.length + 2}>{group}</td>
                </tr>
                {visibleModules
                  .filter((m) => m.group === group)
                  .map((m) => {
                    const rights = draft[m.id]?.[role] || '';
                    const enabledActions = actionKeys.filter(
                      (a) => !isActionDisabled(m.id, a),
                    );
                    const allChecked =
                      enabledActions.length > 0 &&
                      enabledActions.every((a) => rights.includes(a));
                    return (
                      <tr key={m.id}>
                        <td>{m.navTitle || m.title}</td>
                        <td className="perm-checkbox-cell">
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            disabled={!isAdmin || busy || !enabledActions.length}
                            aria-label={`Chọn tất cả quyền cho ${m.title}`}
                            checked={allChecked}
                            onChange={(e) =>
                              toggleRowAll(m.id, e.target.checked)
                            }
                          />
                        </td>
                        {actionKeys.map((action) => {
                          const disabled = isActionDisabled(m.id, action);
                          return (
                            <td key={action} className="perm-checkbox-cell">
                              <input
                                type="checkbox"
                                className="perm-checkbox"
                                disabled={disabled}
                                title={
                                  m.id === 'exam-results' &&
                                  action === 'A' &&
                                  role !== 'ADMIN'
                                    ? 'Chỉ Admin được duyệt kết quả thi'
                                    : `${m.title} · ${ACTIONS[action]}`
                                }
                                aria-label={`${m.title} · ${ACTIONS[action]}`}
                                checked={rights.includes(action)}
                                onChange={(e) =>
                                  togglePermission(
                                    m.id,
                                    action,
                                    e.target.checked,
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
