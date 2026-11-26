import React from 'react';
import Badge from '../../../components/common/Badge.jsx';

export default function ScheduleGrid({ items, resolve, rowActions, onSelect }) {
  return (
    <div className="schedule-grid">
      {items.map((row) => (
        <article
          className="schedule-card schedule-card-interactive"
          key={row.id}
          role="button"
          tabIndex={0}
          title="Bấm để xem chi tiết buổi tập"
          onClick={() => onSelect?.(row)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect?.(row);
            }
          }}
        >
          <div className="schedule-day">
            <strong>{new Date(row.sessionDate + 'T12:00:00').getDate()}</strong>
            <span>
              THÁNG {new Date(row.sessionDate + 'T12:00:00').getMonth() + 1}
            </span>
          </div>
          <div className="schedule-card-body">
            <Badge value={row.status} />
            <h3>{resolve('classId', row.classId)}</h3>
            <p>
              {row.startTime} – {row.endTime}
            </p>
            <small>{row.location}</small>
            <div
              className="schedule-card-actions"
              onClick={(e) => e.stopPropagation()}
            >
              {rowActions(row)}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
