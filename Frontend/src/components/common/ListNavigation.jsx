import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function ListNavigation({
  page,
  limit,
  total,
  count,
  onPage,
  onLimit,
  busy = false,
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="list-navigation" aria-label="Điều hướng danh sách">
      <span role="status" aria-live="polite">
        {total
          ? `${(page - 1) * limit + 1}–${(page - 1) * limit + count} / ${total}`
          : '0 hồ sơ'}
      </span>
      <label>
        Số dòng{' '}
        <select
          aria-label="Số dòng hiển thị"
          value={limit}
          disabled={busy}
          onChange={(e) => onLimit(Number(e.target.value))}
        >
          {[...new Set([25, 50, 100, limit])]
            .sort((a, b) => a - b)
            .map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
        </select>
      </label>
      <button
        type="button"
        className="icon-btn bordered"
        aria-label="Trang trước"
        disabled={busy || page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span>
        Trang {page} / {pages}
      </span>
      <button
        type="button"
        className="icon-btn bordered"
        aria-label="Trang sau"
        disabled={busy || page >= pages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
