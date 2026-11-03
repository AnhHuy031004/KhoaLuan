import { useEffect, useState } from "react";
import { api } from "./api";
export function useRemote(load, deps = [], enabled = true) {
  const [state, setState] = useState({
      data: null,
      loading: false,
      error: null,
    }),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState({ data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => load(controller.signal))
      .then(
        (data) => {
          if (active) setState({ data, loading: false, error: null });
        },
        (error) => {
          if (active) setState({ data: null, loading: false, error });
        },
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [...deps, version, enabled]);
  return { ...state, reload: () => setVersion((v) => v + 1) };
}
export function useDebounced(value, delay = 350) {
  const [v, set] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => set(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
export const requestOp = (op, params, body, query, signal) =>
  api.request(
    op.path.replace(/\{([^}]+)\}/g, (_, k) =>
      encodeURIComponent(params?.[k] ?? ""),
    ),
    { method: op.method, body, query, signal },
  );
