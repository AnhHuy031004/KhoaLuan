import React from 'react';
export default function PieChart({ data }) {
  const total = data.reduce((n, d) => n + d.count, 0);
  let start = 0;
  const stops = data
    .map((d) => {
      const end = start + (total ? (d.count / total) * 100 : 0);
      const result = `${d.color} ${start}% ${end}%`;
      start = end;
      return result;
    })
    .join(',');
  return (
    <div className="rank-chart">
      <div
        className="donut"
        role="img"
        aria-label={data.map((d) => `${d.name}: ${d.count} võ sinh`).join(', ')}
        style={{
          background: total ? `conic-gradient(${stops})` : 'var(--border)',
        }}
      >
        <span>
          <strong>{total}</strong>
          <small>Võ sinh</small>
        </span>
      </div>
      <div className="rank-legend">
        {data.map((d) => (
          <div key={d.id}>
            <i style={{ background: d.color }} />
            <span>{d.name}</span>
            <strong>{d.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
