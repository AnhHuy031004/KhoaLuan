/**
 * Fetch all pages from a paginated resource service so statistics, tables,
 * and filtered exports never truncate even when the backend enforces a smaller
 * page size cap (e.g. limit <= 100 while client requests 500).
 */
export async function fetchAllPages(
  service,
  query = {},
  signal,
  { pageSize = 200, maxPages = 200 } = {},
) {
  const items = [];
  const seen = new Set();
  let total = Infinity;
  let lastRes = null;

  for (let page = 1; page <= maxPages && items.length < total; page++) {
    const res = await service.list(
      { ...query, page, limit: pageSize },
      signal,
    );
    lastRes = res;
    const batch = Array.isArray(res?.items) ? res.items : [];
    if (Number.isInteger(res?.total) && res.total >= 0) {
      total = res.total;
    } else if (!Number.isFinite(total)) {
      total = batch.length;
    }

    if (!batch.length) break;

    const beforeCount = items.length;
    for (const row of batch) {
      const key = row?.id ?? `${page}-${items.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(row);
      }
    }

    // Stop if the server returned no new unique items (prevents infinite loops
    // on backends that ignore the page parameter) or if we reached total.
    if (items.length === beforeCount || items.length >= total) break;
  }

  return {
    ...(lastRes || {}),
    items,
    total: Number.isFinite(total) ? Math.max(total, items.length) : items.length,
  };
}
