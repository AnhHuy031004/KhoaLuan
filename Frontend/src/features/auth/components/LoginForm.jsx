import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';

export default function LoginForm() {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [mfa, setMfa] = useState(null);
  const [code, setCode] = useState('');
  const [fieldsUnlocked, setFieldsUnlocked] = useState(false);
  const codeInput = useRef(null);

  useEffect(() => {
    if (mfa) codeInput.current?.focus();
  }, [mfa]);

  const unlockFields = () => {
    if (!fieldsUnlocked) setFieldsUnlocked(true);
  };

  function resetAccount() {
    setMfa(null);
    setCode('');
    setPassword('');
    setError(null);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mfa) {
        await verifyMfa({ mfaToken: mfa, code });
      } else {
        const result = await login({ email, password });
        if (result.mfaRequired) {
          setMfa(result.mfaToken);
          setCode('');
          return;
        }
      }
      navigate('/app/dashboard', { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="login-form"
      onSubmit={submit}
      aria-busy={busy}
      autoComplete="off"
    >
      <label className="field">
        <span>Địa chỉ email</span>
        <div className="input-icon">
          <Mail size={18} className="input-lead-icon" aria-hidden="true" />
          <input
            disabled={busy || !!mfa}
            readOnly={!fieldsUnlocked}
            onFocus={unlockFields}
            onPointerDown={unlockFields}
            type="email"
            name="vvn_account_field"
            autoComplete="off"
            placeholder="Nhập email của bạn"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </label>

      <label className="field">
        <span>Mật khẩu</span>
        <div className="input-icon">
          <LockKeyhole
            size={18}
            className="input-lead-icon"
            aria-hidden="true"
          />
          <input
            disabled={busy || !!mfa}
            readOnly={!fieldsUnlocked}
            onFocus={unlockFields}
            onPointerDown={unlockFields}
            type={show ? 'text' : 'password'}
            name="vvn_secret_field"
            autoComplete="new-password"
            placeholder="Nhập mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="icon-btn password-toggle-btn"
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            disabled={busy || !!mfa}
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>

      {mfa && (
        <label className="field login-verification">
          <span>Mã xác thực tài khoản (2FA)</span>
          <div className="input-icon">
            <KeyRound
              size={18}
              className="input-lead-icon"
              aria-hidden="true"
            />
            <input
              aria-label="Mã xác thực tài khoản"
              ref={codeInput}
              disabled={busy}
              autoComplete="one-time-code"
              placeholder="Nhập mã từ ứng dụng hoặc mã khôi phục"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
          </div>
          <small>
            Nhập mã để hoàn tất xác thực hai bước của tài khoản.
          </small>
        </label>
      )}

      <div className="login-help">
        <span className="security-badge">
          <ShieldCheck size={14} aria-hidden="true" />
          Phiên đăng nhập được bảo vệ
        </span>
        <Link to="/auth/forgot">Quên mật khẩu?</Link>
      </div>

      {error && <ErrorState error={error} />}

      <Button disabled={busy} className="login-submit">
        {busy && <span className="button-loader" aria-hidden="true" />}
        <span>
          {busy
            ? 'Đang đăng nhập…'
            : mfa
              ? 'Xác thực & đăng nhập'
              : 'Đăng nhập'}
        </span>
        {!busy && <ArrowRight size={18} className="submit-arrow" />}
      </Button>

      {mfa && (
        <button
          className="text-btn auth-switch-account"
          disabled={busy}
          type="button"
          onClick={resetAccount}
        >
          Đổi tài khoản khác
        </button>
      )}
    </form>
  );
}
