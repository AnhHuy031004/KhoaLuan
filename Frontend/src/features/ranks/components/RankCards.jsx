import React from 'react';

export default function RankCards({ items, rowActions, onSelect }) {
  return (
    <div className="rank-grid">
      {items.map((row) => (
        <article
          className="rank-card schedule-card-interactive"
          key={row.id}
          role="button"
          tabIndex={0}
          title="Bấm để xem chi tiết cấp đai"
          onClick={() => onSelect?.(row)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect?.(row);
            }
          }}
        >
          <span className="belt" style={{ '--belt-color': row.color }} />
          <small>CẤP ĐỘ {row.level}</small>
          <h3>{row.name}</h3>
          <p>{row.description}</p>
          <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>
        </article>
      ))}
    </div>
  );
}
