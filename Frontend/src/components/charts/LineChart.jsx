import React from 'react';
import { currency } from '../../utils/format.js';
export default function LineChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const points = data.map((d, i) => [
    30 + i * 92,
    145 - (d.revenue / max) * 115,
  ]);
  return (
    <div className="line-chart">
      <svg
        viewBox="0 0 520 180"
        role="img"
        aria-label="Doanh thu 6 tháng từ các giao dịch thành công"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0879ce" stopOpacity=".24" />
            <stop offset="1" stopColor="#0879ce" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 68, 106, 145].map((y, i) => (
          <g key={y}>
            <line
              x1="24"
              x2="500"
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeDasharray="4 5"
            />
            <text x="5" y={y - 5} fill="var(--muted)" fontSize="9">
              {((max * (145 - y)) / 115 / 1000000).toFixed(1)}tr
            </text>
          </g>
        ))}
        <path
          d={
            'M ' +
            points.map((p) => p.join(',')).join(' L ') +
            ' L 490,145 L 30,145 Z'
          }
          fill="url(#revenue-fill)"
        />
        <polyline
          points={points.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="#0879ce"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="var(--surface)"
              stroke="#0879ce"
              strokeWidth="2"
            >
              <title>{data[i].month + ': ' + currency(data[i].revenue)}</title>
            </circle>
            <text
              x={x}
              y="172"
              textAnchor="middle"
              fill="var(--muted)"
              fontSize="11"
            >
              T{Number(data[i].month.slice(5))}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
