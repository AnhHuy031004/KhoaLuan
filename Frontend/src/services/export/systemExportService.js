import { api } from '../api.js';
export async function getSystemExport() {
  return api.request('/exports/system');
}
export async function downloadSystemExport() {
  const snapshot = await getSystemExport();
  const { downloadWorkbook } = await import('../../utils/excelExport.js');
  await downloadWorkbook(snapshot);
  return snapshot;
}
