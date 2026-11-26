import * as XLSX from 'xlsx';
import { buildWorkbook } from './excelExport.js';
self.onmessage = ({ data }) => {
  try {
    const bytes = XLSX.write(buildWorkbook(data), {
      type: 'array',
      compression: true,
      bookType: 'xlsx',
    });
    self.postMessage({ bytes }, [bytes]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
