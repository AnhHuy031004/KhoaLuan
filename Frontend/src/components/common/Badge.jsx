import React from 'react';
import { statusLabels } from '../../utils/format.js';
export default function Badge({ value }) {
  return (
    <span className={'badge badge-' + String(value).toLowerCase()}>
      <i />
      {statusLabels[value] || value || '—'}
    </span>
  );
}
