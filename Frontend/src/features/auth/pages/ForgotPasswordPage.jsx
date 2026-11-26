import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
} from 'lucide-react';
import AuthLayout from '../../../components/layout/AuthLayout.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import { api } from '../../../services/api.js';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const initialToken = new URLSearchParams(location.search).get('token') || '';
  const [email, setEmail] = useState('');
  const [token] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(initialToken ? 'reset' : 'email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === 'email') {
        await api.request('/auth/forgot-password', {
          method: 'POST',
          body: { email },
          public: true,
        });
        setMessage(
          'Nếu email đã được đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.',
        );
        setStep('sent');
      } else {
        if (password !== confirmation)
          throw Error('Mật khẩu xác nhận chưa khớp.');
        await api.request('/auth/reset-password', {
          method: 'POST',
          body: { token, password },
          public: true,
        });
        setStep('done');
        setMessage('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.');
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  if (location.pathname === '/auth/reset' && !initialToken)
    return (
      <AuthLayout>
        <div className="auth-card">
          <div className="auth-card-tricolor" aria-hidden="true" />
          <div className="auth-card-header">
            <div className="auth-emblem-wrap">
              <span className="auth-emblem-halo" aria-hidden="true" />
              <img
                src="/assets/vovinam-logo.png"
                alt="Biểu trưng Vovinam"
                className="auth-emblem-img"
              />
            </div>
            <span className="eyebrow">KHÔI PHỤC TRUY CẬP</span>
            <h2>Liên kết không hợp lệ</h2>
            <p>Liên kết đặt lại mật khẩu bị thiếu hoặc đã thay đổi.</p>
          </div>
          <Link className="btn btn-primary login-submit" to="/auth/forgot">
            <span>Gửi yêu cầu mới</span>
            <ArrowRight size={17} />
          </Link>
          <div className="auth-back-wrap">
            <Link className="back-link" to="/auth/login">
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-tricolor" aria-hidden="true" />
        <div className="auth-card-header">
          <div className="auth-emblem-wrap">
            <span className="auth-emblem-halo" aria-hidden="true" />
            <img
              src="/assets/vovinam-logo.png"
              alt="Biểu trưng Vovinam"
              className="auth-emblem-img"
            />
          </div>
          <span className="eyebrow">KHÔI PHỤC TRUY CẬP</span>
          <h2>{step === 'reset' ? 'Đặt mật khẩu mới' : 'Quên mật khẩu?'}</h2>
          <p>Khôi phục tài khoản bằng email đã đăng ký trong hệ thống.</p>
        </div>

        {message && <div className="info-note">{message}</div>}

        {!['done', 'sent'].includes(step) && (
          <form onSubmit={submit} className="login-form">
            <label className="field">
              <span>
                {step === 'email' ? 'Địa chỉ email' : 'Mật khẩu mới'}
              </span>
              <div className="input-icon">
                {step === 'email' ? (
                  <Mail
                    size={18}
                    className="input-lead-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <LockKeyhole
                    size={18}
                    className="input-lead-icon"
                    aria-hidden="true"
                  />
                )}
                <input
                  disabled={busy}
                  type={
                    step === 'email'
                      ? 'email'
                      : showPwd
                        ? 'text'
                        : 'password'
                  }
                  autoComplete={step === 'email' ? 'email' : 'new-password'}
                  placeholder={
                    step === 'email'
                      ? 'Nhập email đã đăng ký'
                      : 'Tối thiểu 8 ký tự'
                  }
                  minLength={step === 'reset' ? 8 : undefined}
                  required
                  value={step === 'email' ? email : password}
                  onChange={(e) =>
                    step === 'email'
                      ? setEmail(e.target.value)
                      : setPassword(e.target.value)
                  }
                />
                {step === 'reset' && (
                  <button
                    type="button"
                    className="icon-btn password-toggle-btn"
                    aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPwd((v) => !v)}
                  >
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                )}
              </div>
            </label>

            {step === 'reset' && (
              <label className="field">
                <span>Xác nhận mật khẩu mới</span>
                <div className="input-icon">
                  <LockKeyhole
                    size={18}
                    className="input-lead-icon"
                    aria-hidden="true"
                  />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={8}
                    required
                    disabled={busy}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </div>
              </label>
            )}

            {error && <ErrorState error={error} />}

            <Button className="login-submit" disabled={busy}>
              {busy && <span className="button-loader" aria-hidden="true" />}
              <span>
                {busy
                  ? 'Đang xử lý…'
                  : step === 'email'
                    ? 'Gửi hướng dẫn khôi phục'
                    : 'Cập nhật mật khẩu'}
              </span>
              {!busy && <ArrowRight size={17} className="submit-arrow" />}
            </Button>
          </form>
        )}

        <div className="auth-back-wrap">
          <Link className="back-link" to="/auth/login">
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
