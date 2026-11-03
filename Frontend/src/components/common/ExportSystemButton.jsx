import React,{useState} from 'react';
import {Download} from 'lucide-react';
import Button from './Button.jsx';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {useToast} from '../../contexts/ToastContext.jsx';
import {downloadSystemExport} from '../../services/export/systemExportService.js';
export default function ExportSystemButton(){const {user}=useAuth(),toast=useToast();const [busy,setBusy]=useState(false);async function download(){if(busy)return;setBusy(true);try{const result=await downloadSystemExport(user);toast(`Đã xuất toàn bộ dữ liệu được cấp quyền (${result.sheets.length} bảng) ra Excel.`);}catch(e){toast(e.message||'Không thể xuất dữ liệu.','error');}finally{setBusy(false);}}return <Button variant="secondary" disabled={busy} onClick={download}><Download size={16}/>{busy?'Đang xuất Excel…':'Xuất toàn hệ thống (.xlsx)'}</Button>;}
