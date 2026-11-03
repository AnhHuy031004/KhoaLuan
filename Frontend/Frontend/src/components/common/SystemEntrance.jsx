import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Loading from './Loading.jsx';
export default function SystemEntrance({ children }) {
  const { loading } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setIntroDone(true), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    if (loading || !introDone || dismissed) return;
    setLeaving(true);
    const timer = setTimeout(() => setDismissed(true), 220);
    return () => clearTimeout(timer);
  }, [loading, introDone, dismissed]);
  return <>
    <div inert={!dismissed ? true : undefined} aria-hidden={!dismissed ? true : undefined}>{children}</div>
    {!dismissed && <div className={`system-entrance ${leaving ? 'system-entrance--leaving' : ''}`}><Loading fullScreen label={loading ? 'Đang kiểm tra phiên đăng nhập…' : 'Chào mừng đến với võ đường của bạn'} /></div>}
  </>;
}
