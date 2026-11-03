import React from 'react';
export default function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.present + d.absent));
  return (
    <div className="chart-wrap">
      <div className="bar-chart">
        <div className="chart-grid">
          {[100, 75, 50, 25, 0].map((p) => (
            <div key={p}>
              <span>{Math.round((max * p) / 100)}</span>
              <i />
            </div>
          ))}
        </div>
        <div className="bar-columns">
          {data.map((d) => (
            <div className="bar-column" key={d.month}>
              <div
                className="bar-stack"
                tabIndex={0}
                aria-label={`${d.month}: ${d.present} có mặt, ${d.absent} vắng hoặc có phép`}
                title={`${d.present} có mặt / ${d.absent} vắng hoặc có phép`}
              >
                <span
                  className="bar-present"
                  style={{
                    height:
                      Math.max(d.present ? 3 : 0, (d.present / max) * 100) +
                      '%',
                  }}
                />
                <span
                  className="bar-absent"
                  style={{
                    height:
                      Math.max(d.absent ? 3 : 0, (d.absent / max) * 100) + '%',
                  }}
                />
              </div>
              <small>T{Number(d.month.slice(5))}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i className="blue" />
          Có mặt / đi muộn
        </span>
        <span>
          <i className="gold" />
          Vắng / có phép
        </span>
      </div>
    </div>
  );
}
