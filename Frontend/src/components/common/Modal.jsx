import React, { useEffect, useRef, useId, useCallback } from 'react';
import { X } from 'lucide-react';
export default function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  wide = false,
  dirty = false,
  busy = false,
}) {
  const ref = useRef(null),
    latest = useRef({ onClose, dirty, busy }),
    id = useId();
  latest.current = { onClose, dirty, busy };
  const close = useCallback(() => {
    const state = latest.current;
    if (state.busy) return;
    if (
      state.dirty &&
      !window.confirm('Bạn có thay đổi chưa lưu. Bỏ các thay đổi này?')
    )
      return;
    state.onClose?.();
  }, []);
  useEffect(() => {
    const el = ref.current,
      previous = document.activeElement;
    el.showModal();
    const cancel = (e) => {
      e.preventDefault();
      close();
    };
    el.addEventListener('cancel', cancel);
    return () => {
      el.removeEventListener('cancel', cancel);
      el.close();
      previous?.focus?.();
    };
  }, [close]);
  return (
    <dialog
      ref={ref}
      className={'modal ' + (wide ? 'wide' : '')}
      aria-labelledby={id}
      aria-busy={busy}
      onClick={(e) => {
        if (e.target !== ref.current) return;
        const b = ref.current.getBoundingClientRect();
        if (
          e.clientX < b.left ||
          e.clientX > b.right ||
          e.clientY < b.top ||
          e.clientY > b.bottom
        )
          close();
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-btn"
          disabled={busy}
          aria-label="Đóng hộp thoại"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
      {footer && <div className="modal-actions modal-footer">{footer}</div>}
    </dialog>
  );
}
