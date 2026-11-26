import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import Button from './Button.jsx';
export default function FilteredExportButton({
  config,
  service,
  query = {},
  lookups = {},
  rows: providedRows,
}) {
  const { user } = useAuth(),
    toast = useToast(),
    [busy, setBusy] = useState(false),
    controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function download() {
    if (busy) return;
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    try {
      const rows = providedRows ? [...providedRows] : [];
      if (!providedRows) {
        const ids = new Set();
        let total = Infinity;
        for (let page = 1; rows.length < total; page++) {
          const result = await service.list(
            { ...query, page, limit: 200 },
            c.signal,
          );
          if (
            !Array.isArray(result.items) ||
            !Number.isInteger(result.total) ||
            result.total < 0
          )
            throw Error('Dữ liệu xuất không hợp lệ.');
          total = result.total;
          if (!result.items.length && rows.length < total)
            throw Error('Danh sách thay đổi khi xuất. Hãy thử lại.');
          for (const row of result.items) {
            if (ids.has(row.id))
              throw Error('Danh sách thay đổi khi xuất. Hãy thử lại.');
            ids.add(row.id);
            rows.push(row);
          }
        }
        if (rows.length !== total)
          throw Error('Danh sách thay đổi khi xuất. Hãy thử lại.');
      }
      if (c.signal.aborted) return;
      const { downloadWorkbook } = await import('../../utils/excelExport.js');
      await downloadWorkbook({
        generatedAt: new Date().toISOString(),
        user,
        scope: 'Danh sách theo bộ lọc hiện tại',
        filterDescription: JSON.stringify(query),
        lookups,
        sheets: [
          { id: config.id, title: config.title, columns: config.columns, rows },
        ],
      });
      if (!c.signal.aborted)
        toast('Đã xuất ' + rows.length + ' bản ghi theo bộ lọc.');
    } catch (e) {
      if (!c.signal.aborted) toast(e.message, 'error');
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  return (
    <Button variant="secondary" disabled={busy} onClick={download}>
      {busy ? 'Đang xuất…' : 'Xuất danh sách đang lọc'}
    </Button>
  );
}
