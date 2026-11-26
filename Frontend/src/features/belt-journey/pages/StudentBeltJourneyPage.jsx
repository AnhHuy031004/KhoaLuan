import React, { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Trophy,
  Medal,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useRemote } from '../../../hooks/useRemote.js';
import { api } from '../../../services/api.js';
import Loading from '../../../components/common/Loading.jsx';
import ErrorState from '../../../components/common/ErrorState.jsx';
import EmptyState from '../../../components/common/EmptyState.jsx';
import Badge from '../../../components/common/Badge.jsx';
import { formatDate, statusLabels } from '../../../utils/format.js';

export default function StudentBeltJourneyPage() {
  const { user } = useAuth();

  const remote = useRemote(async (signal) => {
    const [ranksRes, resultsRes, historyRes, examsRes, studentsRes] =
      await Promise.all([
        api.request('/belt-ranks', { signal, query: { limit: 100 } }),
        api.request('/exam-results', { signal, query: { limit: 100 } }),
        api.request('/belt-history', { signal, query: { limit: 100 } }),
        api.request('/belt-exams', { signal, query: { limit: 100 } }),
        api.request('/students', { signal, query: { limit: 100 } }),
      ]);
    return {
      ranks: ranksRes?.items || [],
      results: resultsRes?.items || [],
      history: historyRes?.items || [],
      exams: examsRes?.items || [],
      students: studentsRes?.items || [],
    };
  }, [user?.id]);

  const orderedRanks = useMemo(
    () =>
      [...(remote.data?.ranks || [])].sort(
        (a, b) => Number(a.level || 0) - Number(b.level || 0),
      ),
    [remote.data?.ranks],
  );

  const myStudent = useMemo(() => {
    const list = remote.data?.students || [];
    return (
      list.find((s) => s.id === user?.studentId || s.userId === user?.id) ||
      list[0] ||
      null
    );
  }, [remote.data?.students, user?.studentId, user?.id]);

  const currentRank = useMemo(
    () => orderedRanks.find((r) => r.id === myStudent?.rankId) || orderedRanks[0] || null,
    [orderedRanks, myStudent?.rankId],
  );

  const currentLevel = Number(currentRank?.level || 0);
  const nextRank = useMemo(
    () => orderedRanks.find((r) => Number(r.level || 0) > currentLevel) || null,
    [orderedRanks, currentLevel],
  );

  const examMap = useMemo(
    () => Object.fromEntries((remote.data?.exams || []).map((e) => [e.id, e])),
    [remote.data?.exams],
  );
  const rankMap = useMemo(
    () => Object.fromEntries(orderedRanks.map((r) => [r.id, r])),
    [orderedRanks],
  );

  if (remote.loading && !remote.data) return <Loading />;
  if (remote.error) {
    return <ErrorState error={remote.error} retry={remote.reload} />;
  }

  const results = remote.data?.results || [];
  const history = remote.data?.history || [];
  const upcomingExams = (remote.data?.exams || []).filter(
    (e) => e.status === 'APPROVED',
  );

  const progressPercent = orderedRanks.length
    ? Math.round(
        ((orderedRanks.findIndex((r) => r.id === currentRank?.id) + 1) /
          orderedRanks.length) *
          100,
      )
    : 0;

  return (
    <div className="feature-page belt-journey-page">
      <div className="page-heading">
        <div>
          <div className="section-kicker">
            THI &amp; THĂNG ĐAI
            <span />
            VIỆT VÕ ĐẠO
          </div>
          <h1>Hành trình cấp đai &amp; Thi cử</h1>
          <p>
            Theo dõi lộ trình rèn luyện cấp đai Vovinam, điểm thi 4 nội dung và
            lịch sử thăng đai của bạn.
          </p>
        </div>
      </div>

      {/* Belt Progression Roadmap */}
      <section className="panel belt-roadmap-panel">
        <div className="belt-roadmap-head">
          <div>
            <h2>
              <Medal size={20} /> Lộ trình cấp đai Vovinam
            </h2>
            <p>
              Cấp đai hiện tại:{' '}
              <strong>{currentRank?.name || 'Đang cập nhật'}</strong>
              {nextRank ? (
                <>
                  {' '}
                  · Mục tiêu tiếp theo: <strong>{nextRank.name}</strong>
                </>
              ) : (
                ' · Đã đạt cấp đai cao nhất trong danh mục'
              )}
            </p>
          </div>
          <span className="belt-progress-pill">
            <Sparkles size={15} /> {progressPercent}% lộ trình
          </span>
        </div>

        <div className="belt-roadmap-track" role="list" aria-label="Lộ trình cấp đai">
          {orderedRanks.map((rank) => {
            const lv = Number(rank.level || 0);
            const isCurrent = rank.id === currentRank?.id;
            const isCompleted = lv < currentLevel;
            return (
              <div
                key={rank.id}
                role="listitem"
                className={
                  'belt-step ' +
                  (isCurrent
                    ? 'is-current'
                    : isCompleted
                      ? 'is-completed'
                      : 'is-upcoming')
                }
              >
                <span
                  className="belt-step-swatch"
                  style={{ background: rank.color || '#136caa' }}
                  aria-hidden="true"
                />
                <div className="belt-step-body">
                  <small>Cấp {rank.level}</small>
                  <strong>{rank.name}</strong>
                  <span className="belt-step-state">
                    {isCurrent ? (
                      <>
                        <Award size={14} /> Đang mang đai
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle2 size={14} /> Đã hoàn thành
                      </>
                    ) : (
                      <>
                        <Clock size={14} /> Mục tiêu
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exam Results 4-Subject Breakdown */}
      <section className="panel data-panel">
        <div className="data-panel-title">
          <div>
            <h2>
              Kết quả thi 4 nội dung
              <span className="count-pill">{results.length}</span>
            </h2>
            <p>
              Tổng hợp điểm Quyền, Lý thuyết / Thể lực, Căn bản và Đối kháng của
              các kỳ thi bạn đã tham gia.
            </p>
          </div>
        </div>
        {results.length === 0 ? (
          <EmptyState
            title="Chưa có kết quả thi"
            description="Khi bạn tham gia kỳ thi thăng đai và được chấm điểm, bảng điểm 4 môn sẽ hiển thị tại đây."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kỳ thi</th>
                  <th>Quyền</th>
                  <th>Lý thuyết / Thể lực</th>
                  <th>Căn bản</th>
                  <th>Đối kháng</th>
                  <th>Tổng điểm</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Kỳ thi">
                      <strong>{examMap[r.examId]?.title || r.examId}</strong>
                    </td>
                    <td data-label="Quyền">{r.quyenScore ?? '—'}</td>
                    <td data-label="Lý thuyết / Thể lực">
                      {r.theoryFitnessScore ?? '—'}
                    </td>
                    <td data-label="Căn bản">{r.basicScore ?? '—'}</td>
                    <td data-label="Đối kháng">{r.sparringScore ?? '—'}</td>
                    <td data-label="Tổng điểm">
                      <strong>{r.totalScore ?? '—'}</strong>
                    </td>
                    <td data-label="Kết quả">
                      <Badge
                        value={r.status}
                        label={statusLabels[r.status] || r.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Belt History & Upcoming Exams Split */}
      <div className="belt-journey-grid">
        <section className="panel data-panel">
          <div className="data-panel-title">
            <div>
              <h2>
                Lịch sử thăng đai
                <span className="count-pill">{history.length}</span>
              </h2>
            </div>
          </div>
          {history.length === 0 ? (
            <EmptyState
              title="Chưa có lịch sử thăng đai"
              description="Các đợt công nhận cấp đai chính thức sẽ được lưu tại đây."
            />
          ) : (
            <ul className="belt-history-list">
              {history.map((h) => (
                <li key={h.id}>
                  <span
                    className="belt-dot"
                    style={{
                      background: rankMap[h.rankId]?.color || 'var(--primary)',
                    }}
                  />
                  <div>
                    <strong>{rankMap[h.rankId]?.name || h.rankId}</strong>
                    <small>
                      Ngày cấp: {formatDate(h.awardedAt || h.createdAt)}
                      {h.note ? ` · ${h.note}` : ''}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel data-panel">
          <div className="data-panel-title">
            <div>
              <h2>
                Kỳ thi sắp diễn ra
                <span className="count-pill">{upcomingExams.length}</span>
              </h2>
            </div>
          </div>
          {upcomingExams.length === 0 ? (
            <EmptyState
              title="Chưa có kỳ thi mới"
              description="Khi võ đường mở kỳ thi thăng đai đã duyệt, lịch thi sẽ hiển thị tại đây."
            />
          ) : (
            <ul className="belt-history-list">
              {upcomingExams.map((ex) => (
                <li key={ex.id}>
                  <Trophy size={18} className="belt-exam-icon" />
                  <div>
                    <strong>{ex.title}</strong>
                    <small>
                      <CalendarDays size={13} /> {formatDate(ex.examDate)} ·{' '}
                      {ex.location}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
