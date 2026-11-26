import { useState, useEffect } from 'react';
export default function useClientPage(items, resetKey, initialLimit = 50) {
  const [page, setPage] = useState(1),
    [limit, setLimit] = useState(initialLimit);
  useEffect(() => setPage(1), [resetKey]);
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / limit)));
  return {
    items: items.slice((current - 1) * limit, current * limit),
    offset: (current - 1) * limit,
    navigation: {
      page: current,
      limit,
      total: items.length,
      count: Math.min(limit, Math.max(0, items.length - (current - 1) * limit)),
      onPage: setPage,
      onLimit: (n) => {
        setLimit(n);
        setPage(1);
      },
    },
  };
}
