import React from 'react';

export default function RankCards({ items, rowActions }) {
  return (
    <div className="rank-grid">
      {items.map((row) => (
        <article className="rank-card" key={row.id}>
          <span className="belt" style={{ '--belt-color': row.color }} />
          <small>CẤP ĐỘ {row.level}</small>
          <h3>{row.name}</h3>
          <p>{row.description}</p>
          {rowActions(row)}
        </article>
      ))}
    </div>
  );
}
