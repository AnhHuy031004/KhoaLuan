import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, BarChart3, CalendarDays, Filter } from 'lucide-react';
import { api } from '../../services/api.js';
import { useRemote } from '../../hooks/useRemote.js';
import OrganizationScope from '../common/OrganizationScope.jsx';
import ExportSystemButton from '../common/ExportSystemButton.jsx';
import Loading from '../common/Loading.jsx';
import ErrorState from '../common/ErrorState.jsx';
import './reports.css';
const fmt = (value, money = false) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
    notation: money && value >= 1e9 ? 'compact' : 'standard',
  }).format(value) + (money ? ' đ' : '');
function Chart({ chart }) {
  const data = chart.data || [],
    total = data.reduce((n, r) => n + r.value, 0),
    max = Math.max(1, ...data.map((r) => r.value));
  if (!total)
    return (
      <div className="report-empty">
        <BarChart3 size={32} />
        <strong>Chưa có dữ liệu</strong>
        <span>Thử chọn lớp hoặc khoảng thời gian khác.</span>
      </div>
    );
  if (chart.type === 'donut') {
    let start = 0;
    const stops = data
      .map((r) => {
        const end = start + (r.value / total) * 100,
          s = `${r.color} ${start}% ${end}%`;
        start = end;
        return s;
      })
      .join(',');
    return (
      <div className="report-donut-layout">
        <div
          className="report-donut"
          role="img"
          aria-label={data
            .map((r) => `${r.name}: ${fmt(r.value, chart.money)}`)
            .join('; ')}
          style={{ background: `conic-gradient(${stops})` }}
        >
          <div>
            <strong>{fmt(total, chart.money)}</strong>
            <small>{chart.money ? 'Tổng học phí' : chart.unit}</small>
          </div>
        </div>
        <div className="report-legend">
          {data.map((r) => (
            <div key={r.id}>
              <i style={{ background: r.color }} />
              <span>{r.name}</span>
              <strong title={fmt(r.value, chart.money)}>
                {fmt(r.value, chart.money)}
                <small>{((r.value / total) * 100).toFixed(1)}%</small>
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (chart.type === 'line') {
    const width = 640,
      height = 240,
      left = 62,
      right = 22,
      top = 20,
      bottom = 40,
      w = width - left - right,
      h = height - top - bottom,
      x = (i) => left + (data.length === 1 ? w / 2 : (i * w) / (data.length - 1)),
      y = (value) => top + h - (value / max) * h,
      points = data.map((r, i) => `${x(i)},${y(r.value)}`).join(' ');
    return (
      <div className="report-line">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={data
            .map((r) => `${r.name}: ${fmt(r.value, chart.money)}`)
            .join('; ')}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1={left}
                x2={width - right}
                y1={y(max * t)}
                y2={y(max * t)}
                stroke="#2c455b"
                strokeDasharray="4 4"
              />
              <text x={left - 9} y={y(max * t) + 4} textAnchor="end">
                {chart.money
                  ? new Intl.NumberFormat('vi-VN', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(max * t)
                  : Math.round(max * t)}
              </text>
            </g>
          ))}
          <polyline
            points={points}
            fill="none"
            stroke="#42b6ea"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {data.map((r, i) => (
            <g key={r.id}>
              <circle
                cx={x(i)}
                cy={y(r.value)}
                r="5"
                fill="#e6c477"
                stroke="#11283d"
                strokeWidth="2"
              >
                <title>
                  {r.name}: {fmt(r.value, chart.money)}{' '}
                  {chart.money ? '' : chart.unit}
                </title>
              </circle>
              {(data.length <= 8 ||
                i === 0 ||
                i === data.length - 1 ||
                i % Math.ceil(data.length / 6) === 0) && (
                <text x={x(i)} y={height - 12} textAnchor="middle">
                  {r.name}
                </text>
              )}
            </g>
          ))}
        </svg>
        <p>{data.length} tháng có dữ liệu · Rê chuột vào điểm để xem số liệu</p>
      </div>
    );
  }
  return (
    <div className="report-bars">
      {data.map((r, i) => (
        <div className="report-bar-row" key={r.id}>
          <div>
            <span title={r.name}>{r.name}</span>
            <strong>{fmt(r.value, chart.money)}</strong>
          </div>
          <div
            className="report-track"
            role="img"
            aria-label={`${r.name}: ${fmt(r.value, chart.money)} ${chart.money ? '' : chart.unit}`}
          >
            <span
              style={{
                width: `${(r.value / max) * 100}%`,
                background: r.color || ['#35a7df', '#55bd9b', '#e2bc62'][i % 3],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export default function ReportsPage({ config }) {
  const [url] = useSearchParams();
  const wardScope = url.get('wardId') || '',
    clubScope = url.get('clubId') || '';
  const [classId, setClassId] = useState(''),
    [month, setMonth] = useState('');
  useEffect(() => {
    setClassId('');
  }, [wardScope, clubScope]);
  const remote = useRemote(
    (signal) =>
      api.request('/report-charts/' + config.id, {
        query: { classId, month },
        signal,
      }),
    [config.id, classId, month, wardScope, clubScope],
  );
  useEffect(() => {
    const resource =
      config.reportKind === 'students'
        ? 'students'
        : config.reportKind === 'attendance'
          ? 'attendance'
          : config.reportKind === 'tuition'
            ? 'invoices'
            : 'exam-results';
    const off1 = api.subscribeResource?.(resource, remote.reload);
    const off2 =
      config.reportKind === 'promotions'
        ? api.subscribeResource?.('belt-history', remote.reload)
        : undefined;
    return () => {
      off1?.();
      off2?.();
    };
  }, [config.id, config.reportKind, remote.reload]);
  const data = remote.data;
  return (
    <div className="reports-page">
      <OrganizationScope />
      <div className="page-heading">
        <div>
          <span className="eyebrow">BÁO CÁO · VOVINAM</span>
          <h1>{config.title}</h1>
          <p>Thống kê trực quan theo dữ liệu trong phạm vi quyền truy cập.</p>
        </div>
        <ExportSystemButton />
      </div>
      <section className="report-filters">
        <div className="report-filter-caption">
          <Filter size={18} />
          <strong>Bộ lọc báo cáo</strong>
        </div>
        <label>
          Lớp học
          <select
            aria-label="Lớp báo cáo"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Tất cả lớp được cấp quyền</option>
            {data?.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Thời gian
          <input
            aria-label="Tháng báo cáo"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setClassId('');
            setMonth('');
          }}
        >
          Đặt lại
        </button>
        <button
          className="icon-btn"
          aria-label="Tải lại báo cáo"
          onClick={remote.reload}
        >
          <RefreshCw size={18} />
        </button>
      </section>
      {remote.loading ? (
        <Loading />
      ) : remote.error ? (
        <ErrorState error={remote.error} retry={remote.reload} />
      ) : (
        data && (
          <>
            <div className="report-scope">
              <span>
                <CalendarDays size={15} />
                {month || 'Toàn bộ thời gian'} ·{' '}
                {classId
                  ? data.classes.find((c) => c.id === classId)?.name
                  : 'Tất cả lớp được cấp quyền'}
              </span>
              <small>{data.recordCount} bản ghi nguồn</small>
            </div>
            <div className="report-metrics">
              {data.cards.map((card, i) => (
                <article
                  key={card.label}
                  style={{
                    '--metric-accent': [
                      '#35a7df',
                      '#55bd9b',
                      '#e2bc62',
                      '#a694dc',
                    ][i],
                  }}
                >
                  <span>{card.label}</span>
                  <strong>
                    {fmt(card.value, card.money)}
                    {card.suffix || ''}
                  </strong>
                  <small>
                    {month ? 'Trong tháng đã chọn' : 'Theo bộ lọc hiện tại'}
                  </small>
                </article>
              ))}
            </div>
            <div className="report-charts">
              {data.charts.map((chart) => (
                <section className="report-chart-card" key={chart.title}>
                  <div className="report-chart-heading">
                    <h2>{chart.title}</h2>
                    <span>{chart.money ? 'VND' : chart.unit}</span>
                  </div>
                  <Chart chart={chart} />
                </section>
              ))}
            </div>
            <p className="report-note">{data.note}</p>
            <p className="report-updated">
              Cập nhật lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}
            </p>
          </>
        )
      )}
    </div>
  );
}
