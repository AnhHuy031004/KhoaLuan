import React from 'react';
import { statusLabels } from '../../utils/format.js';

export default function Badge({ value, label }) {
  return (
    <span className={'badge badge-' + String(value).toLowerCase()}>
      <i />
      {label || statusLabels[value] || value || '—'}
    </span>
  );
}
