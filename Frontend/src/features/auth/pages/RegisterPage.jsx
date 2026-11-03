import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '../../../components/layout/AuthLayout.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import { api, IS_MOCK } from '../../../services/api.js';

export default function RegisterPage({ mode = 'register' }) {
  const location = useLocation();
  const initialToken = new URLSearchParams(location.search).get('token') || '';
  const [fullName, setFullName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [role, setRole] = useState('STUDENT'),
    [dateOfBirth, setDateOfBirth] = useState('2005-01-01'),
    [phone, setPhone] = useState(''),
    [token, setToken] = useState(initialToken),
    [step, setStep] = useState(mode),
    [message, setMessage] = useState(''),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      if (step === 'register') {
        if (
          password.length < 8 ||
          !/[A-Za-z]/.test(password) ||
          !/\d/.test(password)
        ) {
          throw Error('Mật khẩu cần ít nhất 8 ký tự, bao gồmทั้ง chữ và số.');
        }
        const body = {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          dateOfBirth,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        };
        const res = await api.request('/auth/register', {
          method: 'POST',
          body,
          public: true,
        });
        if (IS_MOCK && res?.mockVerificationToken) {
          setToken(res.mockVerificationToken);
        }
        setStep('verify');
        setMessage(
          'Đã gửi yêu cầu đăng ký lên máy chủ. Vui lòng kiểm tra email để lấy mã xác minh (hoặc dán mã xác minh vào ô bên dưới).',
        );
      } else if (step === 'verify') {
        await api.request('/auth/verify-email', {
          method: 'POST',
          body: { token: token.trim() },
          public: true,
        });
        setStep('done');
        setMessage('Xác minh email thành công! Bạn có thể đăng nhập ngay.');
      } else if (step === 'resend') {
        await api.request('/auth/resend-verification', {
          method: 'POST',
          body: { email: email.trim() },
          public: true,
        });
        setStep('verify');
        setMessage('Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư.');
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">TÀI KHOẢN VOVINAM API</span>
        <h2>
          {step === 'register'
            ? 'Đăng ký tài khoản'
            : step === 'resend'
              ? 'Gửi lại mã xác minh'
              : 'Xác minh email'}
        </h2>
        <p>
          {step === 'register'
            ? 'Tạo tài khoản Võ sinh hoặc Phụ huynh trực tiếp trên máy chủ API.'
            : 'Nhập mã xác minh từ email để kích hoạt tài khoản.'}
        </p>
        {message && <div className="info-note">{message}</div>}
        {step !== 'done' && (
          <form onSubmit={submit} className="login-form">
            {step === 'register' && (
              <>
                <label className="field">
                  <span>Họ và tên *</span>
                  <input
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Địa chỉ email *</span>
                  <input
                    type="email"
                    required
                    placeholder="ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Mật khẩu (tối thiểu 8 ký tự, gồm chữ và số) *</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="VoSinh2026!x"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <div className="form-grid">
                  <label className="field">
                    <span>Vai trò *</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="STUDENT">Võ sinh (STUDENT)</option>
                      <option value="PARENT">Phụ huynh (PARENT)</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Ngày sinh *</span>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Số điện thoại</span>
                  <input
                    placeholder="+84901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </>
            )}
            {step === 'verify' && (
              <label className="field">
                <span>Mã xác minh email (Token) *</span>
                <input
                  required
                  placeholder="Nhập mã token từ email xác minh"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
            )}
            {step === 'resend' && (
              <label className="field">
                <span>Địa chỉ email đã đăng ký *</span>
                <input
                  type="email"
                  required
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {error && <ErrorState error={error} />}
            <Button className="login-submit" disabled={busy}>
              {busy
                ? 'Đang gửi yêu cầu…'
                : step === 'register'
                  ? 'Đăng ký tài khoản'
                  : step === 'resend'
                    ? 'Gửi lại email'
                    : 'Xác nhận kích hoạt'}
              <ArrowRight size={17} />
            </Button>
          </form>
        )}
        <div className="login-help" style={{ marginTop: 16 }}>
          <Link className="back-link" to="/auth/login" style={{ marginTop: 0 }}>
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
          {step === 'verify' ? (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setStep('resend');
                setError(null);
              }}
            >
              Gửi lại mã xác minh
            </button>
          ) : step === 'register' ? (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setStep('verify');
                setError(null);
              }}
            >
              Đã có mã xác minh?
            </button>
          ) : null}
        </div>
      </div>
    </AuthLayout>
  );
}
