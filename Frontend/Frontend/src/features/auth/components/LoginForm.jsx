import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import Button from '../../../components/common/Button.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
export default function LoginForm() {
  const { login, verifyMfa } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),[mfa,setMfa]=useState(null),[code,setCode]=useState('');
  const codeInput = useRef(null);
  useEffect(() => { if (mfa) codeInput.current?.focus(); }, [mfa]);
  function resetAccount() { setMfa(null); setCode(''); setPassword(''); setError(null); }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if(mfa)await verifyMfa({mfaToken:mfa,code});else{const result=await login({email,password});if(result.mfaRequired){setMfa(result.mfaToken);setCode('');return;}}
      const target = location.state?.from;
      navigate(
        typeof target === 'string' && target.startsWith('/app/')
          ? target
          : '/app/dashboard',
        { replace: true },
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="login-form" onSubmit={submit} aria-busy={busy}>

      <label className="field">
        <span>Địa chỉ email</span>
        <div className="input-icon">
          <Mail size={18} />
          <input
            disabled={busy || !!mfa}
            type="email"
            autoComplete="username"
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
          <LockKeyhole size={18} />
          <input
            disabled={busy || !!mfa}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            disabled={busy || !!mfa}
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      {mfa && <label className="field login-verification"><span>Mã xác thực tài khoản</span><input aria-label="Mã xác thực tài khoản" ref={codeInput} disabled={busy} autoComplete="one-time-code" placeholder="Nhập mã từ ứng dụng hoặc mã khôi phục" required value={code} onChange={e => setCode(e.target.value.trim())} /><small>Nhập mã để hoàn tất xác thực hai bước của tài khoản.</small></label>}
      <div className="login-help">
        <span>
          <ShieldInfo />
          Phiên đăng nhập được bảo vệ
        </span>
        <Link to="/auth/forgot">Quên mật khẩu?</Link>
      </div>
      {error && <ErrorState error={error} />}
      <Button disabled={busy} className="login-submit">
        {busy && <span className="button-loader" aria-hidden="true" />}
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        <ArrowRight size={18} />
      </Button>
      {mfa && <button className="text-btn" disabled={busy} type="button" onClick={resetAccount}>Đổi tài khoản</button>}
    </form>
  );
}
function ShieldInfo() {
  return <LockKeyhole size={13} />;
}
