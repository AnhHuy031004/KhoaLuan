import React from 'react';
import { ShieldCheck, MoveUpRight } from 'lucide-react';
export default function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="/auth/login">
          <img src="/assets/vovinam-logo.png" alt="Logo Vovinam" />
          <span>
            <strong>
              VOVINAM<span className="brand-dot">.</span>
            </strong>
            <small>VIỆT VÕ ĐẠO</small>
          </span>
        </a>
        <div className="auth-story-content">
          <span className="auth-pretitle">
            <span />
            TINH HOA VÕ VIỆT
          </span>
          <h1>
            Rèn ý chí.
            <br />
            Vững <em>bản lĩnh.</em>
          </h1>
          <p>
            Mỗi buổi tập là một bước tiến.
            <br />
            Cùng xây dựng một cộng đồng Vovinam
            <br className="desktop-break" /> kỷ luật, kết nối và phát triển.
          </p>
          <div className="auth-pillars">
            <span>
              01 <strong>Kỷ luật</strong>
            </span>
            <span>
              02 <strong>Bản lĩnh</strong>
            </span>
            <span>
              03 <strong>Nhân ái</strong>
            </span>
          </div>
        </div>
        <div className="auth-seal">
          <img src="/assets/vovinam-logo.png" alt="" />
          <span className="seal-orbit" />
        </div>
        <div className="auth-story-footer">
          <ShieldCheck size={17} />
          <span>Vovinam · Đồng hành trên hành trình rèn luyện</span>
        </div>
        <div className="auth-decoration" aria-hidden="true" />
      </section>
      <section className="auth-form-area">
        {children}
        <footer>Vovinam Management · {new Date().getFullYear()}</footer>
      </section>
    </main>
  );
}
