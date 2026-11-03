import { useState, useEffect, useCallback } from 'react';
export function useRemote(load, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let alive = true;
    const c = new AbortController();
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(() => load(c.signal))
      .then((v) => alive && setData(v))
      .catch((e) => alive && e.message !== 'Yêu cầu đã hủy.' && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      c.abort();
    };
  }, [...deps, version]);
  return { data, error, loading, reload };
}
