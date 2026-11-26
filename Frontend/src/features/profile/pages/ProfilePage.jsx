import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserRound, LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useToast } from '../../../contexts/ToastContext.jsx';
import { roleLabel } from '../../../utils/permissions.js';
import { initials, accountCredentials } from '../../../utils/format.js';
import { api } from '../../../services/api.js';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';

const PHONE_REGEX = /^(\+84|0)\d{8,10}$/;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwords, setPasswords] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const credentials = accountCredentials(user);

  useEffect(() => {
    const target =
      location.hash === '#account-security'
        ? 'account-security'
        : location.hash === '#account-info'
          ? 'account-info'
          : '';
    if (!target) return;
    const section = document.getElementById(target);
    section?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
    section?.querySelector('input')?.focus({ preventScroll: true });
  }, [location.hash]);

  async function save(e, security = false) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!security) {
      const nextErrors = {};
      const cleanedName = String(name || '').replace(/\s+/g, ' ').trim();
      const cleanedPhone = String(phone || '').replace(/[\s.-]/g, '').trim();

      if (cleanedName.length < 2) {
        nextErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự hợp lệ.';
      }
      if (cleanedPhone && !PHONE_REGEX.test(cleanedPhone)) {
        nextErrors.phone =
          'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc +84901234567).';
      }
      if (Object.keys(nextErrors).length) {
        setFieldErrors(nextErrors);
        return;
      }

      setBusy(true);
      try {
        const updated = await api.request('/auth/profile', {
          method: 'PATCH',
          body: { fullName: cleanedName, phone: cleanedPhone },
        });
        setName(updated.fullName || cleanedName);
        setPhone(updated.phone || cleanedPhone);
        updateUser(updated);
        toast('Đã cập nhật hồ sơ.');
      } catch (err) {
        setError(err);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      if (passwords.newPassword !== passwords.confirm)
        throw Error('Mật khẩu xác nhận chưa khớp.');
      await api.request('/auth/change-password', {
        method: 'POST',
        body: passwords,
      });
      setPasswords({});
      toast('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      api.clear();
      window.dispatchEvent(new Event('vovinam:expired'));
    } catch (err) {
      setError(err);
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
      {credentials.teaching && (
        <section
          className="panel account-professional-panel"
          aria-label="Thông tin chuyên môn"
        >
          <h2>Thông tin chuyên môn</h2>
          <div>
            <span>Cấp đai / đẳng</span>
            <strong className={credentials.rank ? '' : 'account-needs-info'}>
              {credentials.rank || 'Cần bổ sung'}
            </strong>
          </div>
          <div>
            <span>Bằng cấp / chứng chỉ</span>
            <strong
              className={credentials.certificate ? '' : 'account-needs-info'}
            >
              {credentials.certificate || 'Cần bổ sung'}
            </strong>
          </div>
        </section>
      )}
      {error && <ErrorState error={error} />}
      <div className="dashboard-grid">
        <section className="panel" id="account-info">
          <div className="panel-heading">
            <h2>
              <UserRound size={19} />
              Thông tin cá nhân
            </h2>
          </div>
          <form onSubmit={save} className="stack-form" noValidate>
            <label className="field">
              <span>Họ và tên</span>
              <input
                value={name}
                required
                minLength={2}
                aria-invalid={fieldErrors.fullName ? 'true' : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.fullName)
                    setFieldErrors((v) => ({ ...v, fullName: undefined }));
                }}
              />
              {fieldErrors.fullName && (
                <small role="alert" style={{ color: 'var(--danger, #f87171)' }}>
                  {fieldErrors.fullName}
                </small>
              )}
            </label>
            <label className="field">
              <span>Số điện thoại</span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="0901234567"
                value={phone}
                aria-invalid={fieldErrors.phone ? 'true' : undefined}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone)
                    setFieldErrors((v) => ({ ...v, phone: undefined }));
                }}
              />
              {fieldErrors.phone && (
                <small role="alert" style={{ color: 'var(--danger, #f87171)' }}>
                  {fieldErrors.phone}
                </small>
              )}
            </label>
            <label className="field">
              <span>Địa chỉ email</span>
              <input value={user.email} disabled />
            </label>
            <div>
              <Button disabled={busy}>
                <Save size={16} />
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </section>
        <section className="panel" id="account-security">
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
            {user.mfaEnabled && (
              <label className="field">
                <span>Mã xác thực hai bước</span>
                <input
                  autoComplete="one-time-code"
                  required
                  value={passwords.code || ''}
                  onChange={(e) =>
                    setPasswords((v) => ({ ...v, code: e.target.value }))
                  }
                />
              </label>
            )}
            <div>
              <Button disabled={busy}>Đổi mật khẩu</Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
