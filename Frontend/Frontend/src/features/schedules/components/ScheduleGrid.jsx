import React from 'react';
import Badge from '../../../components/common/Badge.jsx';
export default function ScheduleGrid({ items, resolve, rowActions }) {
  return (
    <div className="schedule-grid">
      {items.map((row) => (
        <article className="schedule-card" key={row.id}>
          <div className="schedule-day">
            <strong>{new Date(row.sessionDate + 'T12:00:00').getDate()}</strong>
            <span>
              THÁNG {new Date(row.sessionDate + 'T12:00:00').getMonth() + 1}
            </span>
          </div>
          <div>
            <Badge value={row.status} />
            <h3>{resolve('classId', row.classId)}</h3>
            <p>
              {row.startTime} – {row.endTime}
            </p>
            <small>{row.location}</small>
            {rowActions(row)}
          </div>
        </article>
      ))}
    </div>
  );
}
