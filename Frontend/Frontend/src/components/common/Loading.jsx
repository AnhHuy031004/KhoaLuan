import React from 'react';
export default function Loading({ fullScreen = false, label = 'Đang tải dữ liệu…' }) {
  return (
    <div className={`system-loading ${fullScreen ? 'system-loading--fullscreen' : ''}`} role="status" aria-live="polite" aria-busy="true">
      <div className="loading-emblem" aria-hidden="true"><span /><img src="/assets/vovinam-logo.png" alt="" /></div>
      <div className="loading-copy"><strong>{fullScreen ? 'VOVINAM' : 'Đang chuẩn bị nội dung'}</strong><p>{label}</p></div>
      <div className="loading-track" aria-hidden="true"><i /></div>
      {!fullScreen && <div className="loading-skeleton" aria-hidden="true"><i /><i /><i /></div>}
    </div>
  );
}
