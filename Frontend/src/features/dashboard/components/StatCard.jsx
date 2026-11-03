import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  to,
  tone = 'blue',
}) {
  return (
    <Link className={'metric-card tone-' + tone} to={to}>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon size={21} />
        </span>
        <ArrowUpRight size={17} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Link>
  );
}
