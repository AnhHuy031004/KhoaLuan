import { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// One navigation per event keeps combined filter/page changes together in history.
export default function useListFilters(defaults) {
  const [params, setParams] = useSearchParams(),
    rendered = params.toString();
  const state = useRef({
    rendered,
    draft: rendered,
    pending: false,
    replace: true,
    alive: true,
  });
  if (state.current.rendered !== rendered) {
    state.current.rendered = rendered;
    state.current.draft = rendered;
  }
  useEffect(() => {
    state.current.alive = true;
    return () => {
      state.current.alive = false;
    };
  }, []);
  const parse = (key, p) => {
    const fallback = defaults[key],
      raw = p.get(key);
    return typeof fallback === 'number'
      ? Math.max(1, Math.floor(Number(raw) || fallback))
      : (raw ?? fallback);
  };
  const values = Object.fromEntries(
    Object.keys(defaults).map((key) => [key, parse(key, params)]),
  );
  const setters = Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      (next, options = {}) => {
        const current = state.current,
          p = new URLSearchParams(current.draft);
        const value = typeof next === 'function' ? next(parse(key, p)) : next;
        if (String(parse(key, p)) === String(value)) return;
        p.set(key, String(value));
        current.draft = p.toString();
        current.replace = current.replace && (options.replace ?? key === 'q');
        if (current.pending) return;
        current.pending = true;
        queueMicrotask(() => {
          current.pending = false;
          const replace = current.replace;
          current.replace = true;
          if (current.alive)
            setParams(new URLSearchParams(current.draft), { replace });
        });
      },
    ]),
  );
  return { values, setters };
}
