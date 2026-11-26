import React from 'react';

/**
 * Simulated QR SVG — strictly for mock/fixture testing mode (IS_MOCK === true).
 */
export default function SimulatedQrSvg({ seed = 'VOVINAM' }) {
  const cells = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const size = 21;
  const isFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        const lr = r >= size - 7 ? r - (size - 7) : r;
        const lc = c >= size - 7 ? c - (size - 7) : c;
        const border = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const center = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        if (border || center) cells.push([r, c]);
      } else {
        const bit =
          ((hash ^ (r * 73 + c * 137 + r * c * 19)) >>> ((r + c) % 7)) & 1;
        if (bit) cells.push([r, c]);
      }
    }
  }

  return (
    <svg
      width="196"
      height="196"
      viewBox="0 0 21 21"
      role="img"
      aria-label={`Mã QR mô phỏng kiểm thử ${seed}`}
      style={{ display: 'block' }}
    >
      <rect width="21" height="21" fill="#ffffff" />
      {cells.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={c}
          y={r}
          width="1"
          height="1"
          fill="#0b1c36"
        />
      ))}
    </svg>
  );
}
