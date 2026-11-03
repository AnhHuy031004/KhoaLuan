import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ page, total, limit, onChange, onLimit }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="pagination">
      <span>
        Hiển thị{' '}
        <strong>
          {total ? Math.min((page - 1) * limit + 1, total) : 0}–
          {Math.min(page * limit, total)}
        </strong>{' '}
        trên {total} bản ghi
      </span>
      <div>
        <select
          aria-label="Số dòng mỗi trang"
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
        >
          {[8, 15, 30, 50].map((v) => (
            <option key={v} value={v}>
              {v} / trang
            </option>
          ))}
        </select>
        <button
          className="icon-btn"
          disabled={page === 1}
          aria-label="Trang trước"
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-number">
          {page} / {pages}
        </span>
        <button
          className="icon-btn"
          disabled={page >= pages}
          aria-label="Trang sau"
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
