import React, { useState } from 'react';
import { UserRound, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { ROLES, roleLabel } from '../../../utils/permissions.js';
import { initials } from '../../../utils/format.js';
import { api, IS_MOCK } from '../../../services/api.js';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
export default function ProfilePage() {
  const { user, updateUser } = useAuth(),
    toast = useToast();
  const [name, setName] = useState(user.fullName),
    [phone, setPhone] = useState(user.phone || ''),
    [passwords, setPasswords] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  async function save(e, security = false) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (security) {
        if (passwords.newPassword !== passwords.confirm)
          throw Error('Mật khẩu xác nhận chưa khớp.');
        await api.request('/auth/change-password', {
          method: 'POST',
          body: passwords,
        });
        setPasswords({});
        toast('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');if(!IS_MOCK){api.clear();window.dispatchEvent(new Event('vovinam:expired'));}
      } else {
        updateUser(
          await api.request('/auth/profile', {
            method: 'PATCH',
            body: { fullName: name, phone },
          }),
        );
        toast('Đã cập nhật hồ sơ.');
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            CÁ NHÂN
            <span />
            VOVINAM
          </div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin và bảo mật tài khoản của bạn.</p>
        </div>
      </div>
      <div className="profile-banner">
        <span className="avatar large">{initials(user.fullName)}</span>
        <div>
          <h2>{user.fullName}</h2>
          <p>{user.email}</p>
          <span className="profile-role">
            <ShieldCheck size={14} />
            {roleLabel(user)}
          </span>
        </div>
      </div>
      {error && <ErrorState error={error} />}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <UserRound size={19} />
              Thông tin cá nhân
            </h2>
          </div>
          {!IS_MOCK&&<div className="info-note">Thông tin tên và email do máy chủ quản lý. Cập nhật thông tin liên hệ tại Hồ sơ võ sinh.</div>}<form onSubmit={save} className="stack-form">
            <label className="field">
              <span>Họ và tên</span>
              <input
                value={name}
                required
                disabled={!IS_MOCK}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Số điện thoại</span>
              <input value={phone} disabled={!IS_MOCK} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="field">
              <span>Địa chỉ email</span>
              <input value={user.email} disabled />
            </label>
            <div>
              <Button disabled={busy||!IS_MOCK}>
                <Save size={16} />
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <LockKeyhole size={19} />
              Bảo mật tài khoản
            </h2>
          </div>
          <form className="stack-form" onSubmit={(e) => save(e, true)}>
            {[
              ['currentPassword', 'Mật khẩu hiện tại'],
              ['newPassword', 'Mật khẩu mới'],
              ['confirm', 'Xác nhận mật khẩu mới'],
            ].map(([key, label]) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <input
                  type="password"
                  required
                  minLength={key !== 'currentPassword' ? 8 : undefined}
                  autoComplete={
                    key === 'currentPassword'
                      ? 'current-password'
                      : 'new-password'
                  }
                  value={passwords[key] || ''}
                  onChange={(e) =>
                    setPasswords((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              </label>
            ))}
            {user.mfaEnabled&&<label className="field"><span>Mã xác thực hai bước</span><input autoComplete="one-time-code" required value={passwords.code||''} onChange={e=>setPasswords(v=>({...v,code:e.target.value}))}/></label>}
            <div>
              <Button disabled={busy}>Đổi mật khẩu</Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
