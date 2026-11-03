import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '../../../components/layout/AuthLayout.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import { api, IS_MOCK } from '../../../services/api.js';
export default function ForgotPasswordPage() {
  const location = useLocation();
  const initialToken = new URLSearchParams(location.search).get('token') || '';
  const [email, setEmail] = useState(''),
    [token, setToken] = useState(initialToken),
    [password, setPassword] = useState(''),
    [step, setStep] = useState(initialToken ? 'reset' : 'email'),
    [message, setMessage] = useState(''),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === 'email') {
        const result = await api.request('/auth/forgot-password', {
          method: 'POST',
          body: { email },
          public: true,
        });
        if (IS_MOCK && result.mockToken) {
          setToken(result.mockToken);
          setStep('reset');
          setMessage(
            'Chế độ kiểm thử: không gửi email. Bạn có thể đặt mật khẩu mới ngay bên dưới.',
          );
        } else
          setMessage(
            'Yêu cầu đã được tiếp nhận. Vui lòng kiểm tra email để tiếp tục.',
          );
      } else {
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
  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">KHÔI PHỤC TRUY CẬP</span>
        <h2>{step === 'reset' ? 'Đặt mật khẩu mới' : 'Quên mật khẩu?'}</h2>
        <p>Khôi phục tài khoản bằng email đã đăng ký.</p>
        {message && <div className="info-note">{message}</div>}
        {step !== 'done' && (
          <form onSubmit={submit} className="login-form">
            <label className="field">
              <span>{step === 'email' ? 'Địa chỉ email' : 'Mật khẩu mới'}</span>
              <input
                type={step === 'email' ? 'email' : 'password'}
                autoComplete={step === 'email' ? 'email' : 'new-password'}
                minLength={step === 'reset' ? 8 : undefined}
                required
                value={step === 'email' ? email : password}
                onChange={(e) =>
                  step === 'email'
                    ? setEmail(e.target.value)
                    : setPassword(e.target.value)
                }
              />
            </label>
            {error && <ErrorState error={error} />}
            <Button className="login-submit" disabled={busy}>
              {busy
                ? 'Đang xử lý…'
                : step === 'email'
                  ? 'Tiếp tục'
                  : 'Cập nhật mật khẩu'}
              <ArrowRight size={17} />
            </Button>
          </form>
        )}
        <Link className="back-link" to="/auth/login">
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
