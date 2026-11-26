import { validDemoDatabase } from '../../../../../../src/utils/demoDatabase.js';
import React, { useState } from 'react';
import { DB_KEY } from '../../../../../../src/config/demoStorage.js';
import { IS_MOCK } from '../../../../../../src/services/api.js';
import { useAuth } from '../../../../../../src/contexts/AuthContext.jsx';
import ExportSystemButton from '../../../../../../src/components/common/ExportSystemButton.jsx';
async function checksum(db) {
  const bytes = new TextEncoder().encode(JSON.stringify(db));
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
function download(name, text) {
  const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    ),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function RecoveryTools({ emergency = false }) {
  const { user } = useAuth(),
    [candidate, setCandidate] = useState(null),
    [confirmation, setConfirmation] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  let healthy = false;
  try {
    healthy = validDemoDatabase(
      JSON.parse(localStorage.getItem(DB_KEY) || 'null'),
    );
  } catch (error) {
    healthy = false;
  }
  if (!IS_MOCK) return null;
  if (user?.role !== 'ADMIN' && healthy)
    return (
      <section className="panel">
        <h2>Khôi phục dữ liệu demo</h2>
        <p>
          Hãy đăng nhập bằng tài khoản Admin để sao lưu hoặc thay dữ liệu hiện
          có.
        </p>
      </section>
    );
  if (!emergency && user?.role !== 'ADMIN') return null;
  async function backup() {
    try {
      const db = JSON.parse(localStorage.getItem(DB_KEY));
      if (!db) throw Error('Chưa có dữ liệu để sao lưu.');
      db.sessions = {};
      db.resetTokens = {};
      download(
        'Vovinam_backup_' + Date.now() + '.json',
        JSON.stringify({
          format: 'vovinam-backup-v1',
          createdAt: new Date().toISOString(),
          checksum: await checksum(db),
          db,
        }),
      );
    } catch (e) {
      setError(e.message);
    }
  }
  async function select(e) {
    setError('');
    setCandidate(null);
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 25 * 1024 * 1024)
        throw Error('Bản sao lưu vượt quá 25 MB.');
      const v = JSON.parse(await file.text());
      if (
        v.format !== 'vovinam-backup-v1' ||
        !validDemoDatabase(v.db) ||
        !v.db.users.some((u) => u.role === 'ADMIN' && u.status === 'ACTIVE') ||
        (await checksum(v.db)) !== v.checksum
      )
        throw Error('Bản sao lưu không hợp lệ hoặc đã bị thay đổi.');
      setCandidate(v);
    } catch (e) {
      setError(e.message);
    }
  }
  async function restore() {
    if (!candidate || confirmation !== 'KHÔI PHỤC' || busy) return;
    setBusy(true);
    try {
      const original = localStorage.getItem(DB_KEY);
      if (original)
        download('Vovinam_before_restore_' + Date.now() + '.json', original);
      const db = { ...candidate.db, sessions: {}, resetTokens: {} };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      sessionStorage.clear();
      window.location.assign('/auth/login');
    } catch (e) {
      setError('Không thể khôi phục: ' + e.message);
      setBusy(false);
    }
  }
  return (
    <section className="panel stack-form">
      <h2>Sao lưu và khôi phục dữ liệu demo</h2>
      <p>
        Bản demo chỉ lưu trên trình duyệt này. File sao lưu có hồ sơ và mật khẩu
        demo; giữ riêng tư. Khôi phục sẽ thay dữ liệu cục bộ và đăng xuất các
        phiên demo. Bản dữ liệu hiện tại được tải xuống trước khi thay.
      </p>
      <div className="heading-actions">
        <button className="btn" onClick={backup}>
          Tải bản sao lưu
        </button>
        <button
          className="btn btn-secondary"
          onClick={() =>
            download(
              'Vovinam_raw_' + Date.now() + '.json',
              localStorage.getItem(DB_KEY) || 'null',
            )
          }
        >
          Tải dữ liệu gốc để hỗ trợ
        </button>
        {!emergency && <ExportSystemButton />}
      </div>
      <label className="field">
        Chọn bản sao lưu JSON
        <input type="file" accept=".json,application/json" onChange={select} />
      </label>
      {candidate && (
        <>
          <p>
            Đã kiểm tra bản sao lưu {candidate.createdAt}:{' '}
            {candidate.db.students.length} võ sinh.
          </p>
          <label className="field">
            Nhập KHÔI PHỤC để xác nhận thay dữ liệu
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <button
            className="btn"
            disabled={busy || confirmation !== 'KHÔI PHỤC'}
            onClick={restore}
          >
            Khôi phục bản đã chọn
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}
