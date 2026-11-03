import React, { useState } from 'react';
import { api } from '../api';
import { Modal, ErrorState } from '../components';
import { SCORE_FIELDS, totalScore, readScores, encodeScores } from './scores';
export default function ScoreResultDialog({record, students, onClose, onComplete}) {
  const initial = readScores(record, students);
  const [scores, setScores] = useState(() => Object.fromEntries(SCORE_FIELDS.map(([key]) => [key, initial[key] ?? ''])));
  const [note, setNote] = useState(initial.resultNote || '');
  const [status, setStatus] = useState(['RESULT_PASS','RESULT_FAIL'].includes(record.status) ? record.status : '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const total = totalScore(scores);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (!status) throw Error('Chọn kết quả thi trước khi lưu.');
      await api.request('/exam-registrations/' + encodeURIComponent(record.id) + '/result', {
        method: 'POST', body: { status, resultNote: encodeScores(scores, note) },
      });
      onComplete(); onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  }
  return <Modal title="Nhập kết quả thi" onClose={busy ? () => {} : onClose} wide>
    <form onSubmit={submit}>
      <div className="modal-body">
        <div className="score-context"><strong>{initial.studentName}</strong><span>{record.exam?.title || record.exam?.code || 'Kỳ thi'}</span></div>
        <div className="score-inputs">
          {SCORE_FIELDS.map(([key, title]) => <label key={key}>{title} *<input aria-label={title} type="number" min="0" step="0.01" required value={scores[key]} onChange={e => setScores({...scores,[key]:e.target.value})} /></label>)}
        </div>
        <div className="score-total"><span>Tổng điểm</span><output aria-live="polite">{total === null ? '—' : total.toLocaleString('vi-VN')}</output></div>
        <p className="quiet-note">Tổng điểm bằng tổng bốn điểm thành phần. Kết quả thi được người chấm chọn riêng.</p>
        <label>Kết quả thi *<select aria-label="Kết quả thi" required value={status} onChange={e => setStatus(e.target.value)}><option value="">Chọn kết quả</option><option value="RESULT_PASS">Đạt</option><option value="RESULT_FAIL">Chưa đạt</option></select></label>
        <label>Ghi chú<textarea aria-label="Ghi chú" rows="3" value={note} onChange={e => setNote(e.target.value)} /></label>
        {error && <ErrorState error={error} />}
      </div>
      <footer className="modal-footer"><button className="secondary" type="button" disabled={busy} onClick={onClose}>Hủy</button><button className="primary" disabled={busy || total === null}>{busy ? 'Đang lưu…' : 'Lưu bảng điểm'}</button></footer>
    </form>
  </Modal>;
}
