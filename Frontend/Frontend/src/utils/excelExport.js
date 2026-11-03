import * as XLSX from 'xlsx';
import {leaveReviewStatus} from '../features/leaves/reviewStatus.js';
import {labels, statusLabels} from './format.js';
const extra={reliefType:'Hình thức miễn giảm',submittedName:'HLV đề xuất',reliefId:'Mã đề xuất miễn giảm',id:'ID',scheduleId:'Mã buổi tập',sessionDate:'Ngày tập',startTime:'Bắt đầu',endTime:'Kết thúc',studentCode:'Mã học viên',openedAt:'Mở điểm danh',closedAt:'Chốt lúc',closedBy:'Người chốt',confirmedAt:'Có mặt lúc',confirmedBy:'Người xác nhận',present:'Có mặt',absent:'Vắng mặt',excused:'Có phép',total:'Tổng',rate:'Tỷ lệ',moduleId:'Chức năng',actions:'Các quyền',description:'Mô tả',value:'Giá trị'};
const deny=/password|token|secret|recoveryCodes|resetTokens/i;
const refs={studentId:['students','fullName'],classId:['classes','name'],instructorId:['instructors','fullName'],rankId:['ranks','name'],examId:['exams','title'],invoiceId:['invoices','code']};
function cell(value){if(value===null||value===undefined)return '';if(typeof value==='object')return JSON.stringify(value,(key,v)=>deny.test(key)?undefined:v);return value;}
export function workbookRows(sheet,lookups={}) {
  return sheet.rows.map(row=>{
    const out={};
    for(const key of [...new Set([...(sheet.columns||[]),...Object.keys(row)])]){
      if(deny.test(key))continue;
      const value=cell(row[key]);const name=(labels[key]||extra[key]||key)+' ['+key+']';
      if(typeof value==='string'&&value.length>30000){for(let i=0;i<value.length;i+=30000)out[name+(i?' · phần '+(i/30000+1):'')]=value.slice(i,i+30000);}else out[name]=value;
      if(refs[key]){const [table,field]=refs[key];out[(extra[key]||labels[key]||key)+' · Tên']=lookups[table]?.find(r=>r.id===row[key])?.[field]||'';}
      if(key==='reliefType')out['Hình thức · Diễn giải']=row[key]==='EXEMPTION'?'Miễn toàn bộ học phí':'Giảm học phí';
      if(key==='status')out['Trạng thái · Diễn giải']=(sheet.id==='leaves'||(sheet.id==='discounts'&&['PENDING','APPROVED','REJECTED'].includes(row[key]))?leaveReviewStatus(row).label:statusLabels[row[key]])||(row[key]==='UNMARKED'?'Chưa điểm danh':row[key]);
    }
    return out;
  });
}
export function buildWorkbook(snapshot) {
  const wb=XLSX.utils.book_new(),names=new Set();
  function add(title,rows,headers=[]){let base=title.replace(/[\\/?*\[\]:]/g,' ').slice(0,31)||'Dữ liệu',name=base,i=1;while(names.has(name))name=base.slice(0,26)+' '+(++i);names.add(name);
    const ws=rows.length?XLSX.utils.json_to_sheet(rows):XLSX.utils.aoa_to_sheet([headers.length?headers:['Không có dữ liệu']]);
    const range=XLSX.utils.decode_range(ws['!ref']||'A1');ws['!autofilter']={ref:XLSX.utils.encode_range(range)};ws['!cols']=Array.from({length:range.e.c+1},(_,col)=>({wch:Math.min(48,Math.max(16,...Array.from({length:Math.min(range.e.r+1,80)},(_,row)=>String(ws[XLSX.utils.encode_cell({r:row,c:col})]?.v||'').length+2)))}));
    XLSX.utils.book_append_sheet(wb,ws,name);return name;
  }
  const manifest=snapshot.sheets.map(s=>({id:s.id,title:s.title,rows:s.rows.length}));
  add('Tổng quan',[{Mục:'Thời điểm xuất',Giá_trị:snapshot.generatedAt},{Mục:'Người xuất',Giá_trị:snapshot.user.fullName},{Mục:'Vai trò',Giá_trị:snapshot.user.role},{Mục:'Phạm vi',Giá_trị:snapshot.scope},{Mục:'Bộ lọc',Giá_trị:'Toàn bộ dữ liệu; không áp dụng tìm kiếm, lọc hoặc phân trang trên màn hình'},{Mục:'Thông tin bảo mật',Giá_trị:'Không xuất mật khẩu, token, bí mật MFA hoặc phiên đăng nhập'},{Mục:'Ô dài',Giá_trị:'Văn bản trên 30.000 ký tự được nối tiếp ở các cột phần 2, phần 3…'}]);
  add('Danh mục dữ liệu',manifest.map(s=>({'Mã chức năng':s.id,'Tên dữ liệu':s.title,'Số bản ghi':s.rows})));
  for(const sheet of snapshot.sheets){const rows=workbookRows(sheet,snapshot.lookups);if(!rows.length)add(sheet.title,[],(sheet.columns||[]).filter(k=>!deny.test(k)).map(k=>(labels[k]||extra[k]||k)+' ['+k+']'));else for(let i=0;i<rows.length;i+=1048575)add(sheet.title+(i?' '+(Math.floor(i/1048575)+1):''),rows.slice(i,i+1048575));}
  return wb;
}
export function downloadWorkbook(snapshot){const name='Vovinam_ToanHeThong_'+new Date().toISOString().replace(/[:.]/g,'-')+'.xlsx';XLSX.writeFile(buildWorkbook(snapshot),name,{compression:true,bookType:'xlsx'});}
