import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export default function AuthLayout({ children }) {
  const themeCtx = useTheme();
  const theme = themeCtx?.theme || 'dark';
  const toggleTheme = themeCtx?.toggle;

  return (
    <main className="auth-layout auth-centered">
      {/* Clean ambient lighting inspired by Vovinam emblem colors */}
      <div className="auth-bg-layer" aria-hidden="true">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow auth-bg-glow-blue" />
        <div className="auth-bg-glow auth-bg-glow-gold" />
        <div className="auth-bg-glow auth-bg-glow-red" />
      </div>

      {/* Top utility bar */}
      <header className="auth-topbar">
        <Link className="auth-topbar-brand" to="/auth/login">
          <img src="/assets/vovinam-logo.png" alt="Logo Vovinam" />
          <span>
            <strong>
              VOVINAM<span className="brand-dot">.</span>
            </strong>
            <small>VIỆT VÕ ĐẠO</small>
          </span>
        </Link>

        {toggleTheme && (
          <button
            type="button"
            className="auth-theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Chuyển sang giao diện sáng'
                : 'Chuyển sang giao diện tối'
            }
            title={
              theme === 'dark'
                ? 'Chuyển sang giao diện sáng'
                : 'Chuyển sang giao diện tối'
            }
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
          </button>
        )}
      </header>

      {/* Perfectly centered card stage */}
      <section className="auth-center-stage">
        <div className="auth-card-shell">{children}</div>
      </section>

      {/* Evenly anchored footer with Vovinam pillars */}
      <footer className="auth-center-footer">
        <div className="auth-pillars-bar" aria-label="Giá trị cốt lõi Vovinam">
          <span>
            <b>01</b> Kỷ luật
          </span>
          <i aria-hidden="true" />
          <span>
            <b>02</b> Bản lĩnh
          </span>
          <i aria-hidden="true" />
          <span>
            <b>03</b> Nhân ái
          </span>
        </div>
        <p className="auth-copyright">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>
            Vovinam Management · Việt Võ Đạo · {new Date().getFullYear()}
          </span>
        </p>
      </footer>
    </main>
  );
}
