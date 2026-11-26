import React from 'react';
export default function Footer() {
  return (
    <footer className="page-footer">
      <span>© {new Date().getFullYear()} Vovinam · Việt Võ Đạo</span>
      <span>
        v{__APP_VERSION__} · {__BUILD_DATE__}
      </span>
    </footer>
  );
}
