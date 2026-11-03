const palette=['#35a7df','#e2bc62','#55bd9b','#a694dc','#e88491','#6bcad2'];
const sum=(rows,key)=>rows.reduce((n,r)=>n+(Number(r[key])||0),0);
export function reportCharts({db,user,id,query,scoped}){
 const studentById=new Map(db.students.map(s=>[s.id,s]));
 const classes=scoped('classes',db.classes),className=id=>db.classes.find(c=>c.id===id)?.name||'Chưa phân lớp';
 const inPeriod=date=>{const text=String(date||'');return(!query.month||text.slice(0,7)===query.month)&&(!query.year||text.slice(0,4)===query.year);};
 const classId=r=>r.classId||studentById.get(r.studentId)?.classId;
 const filter=(rows,dateKey)=>rows.filter(r=>(!query.classId||classId(r)===query.classId)&&inPeriod(r[dateKey]));
 const group=(rows,key,name,amount)=>[...new Set(rows.map(key))].map((value,i)=>({id:value||'none',name:name(value),value:amount?sum(rows.filter(r=>key(r)===value),amount):rows.filter(r=>key(r)===value).length,color:palette[i%palette.length]}));
 const monthly=(rows,dateKey,amount)=>{const observed=[...new Set(rows.map(r=>String(r[dateKey]||'').slice(0,7)).filter(k=>/^\d{4}-\d{2}$/.test(k)))].sort(),keys=[];if(observed.length){const end=observed.at(-1),date=new Date(observed[0]+'-01T00:00:00Z');while(date.toISOString().slice(0,7)<=end){keys.push(date.toISOString().slice(0,7));date.setUTCMonth(date.getUTCMonth()+1);}}return keys.map(key=>({id:key,name:key.slice(5)+'/'+key.slice(0,4),value:amount?sum(rows.filter(r=>String(r[dateKey]).startsWith(key)),amount):rows.filter(r=>String(r[dateKey]).startsWith(key)).length}));};
 let cards,charts,rows,note;
 if(id==='student-report'){
  rows=filter(scoped('students',db.students),'createdAt');
  cards=[{label:'Tổng võ sinh',value:rows.length},{label:'Đang học',value:rows.filter(r=>r.status==='ACTIVE').length},{label:'Tạm nghỉ',value:rows.filter(r=>r.status==='PAUSED').length},{label:'Lớp có học viên',value:new Set(rows.map(r=>r.classId).filter(Boolean)).size}];
  charts=[{type:'bars',title:'Võ sinh theo lớp',unit:'võ sinh',data:group(rows,r=>r.classId,className)},{type:'donut',title:'Phân bố cấp đai',unit:'võ sinh',data:db.ranks.map(r=>({id:r.id,name:r.name,value:rows.filter(s=>s.rankId===r.id).length,color:r.color}))},{type:'bars',title:'Tình trạng học tập',unit:'võ sinh',data:group(rows,r=>r.status,s=>({ACTIVE:'Đang học',PAUSED:'Tạm nghỉ'}[s]||s))},{type:'line',title:'Hồ sơ mới theo tháng',unit:'hồ sơ',data:monthly(rows,'createdAt')}];
  note='Bộ lọc thời gian tính theo ngày tạo hồ sơ. Phân lớp và cấp đai phản ánh hồ sơ hiện tại.';
 }else if(id==='attendance-report'){
  rows=filter(scoped('attendance',db.attendance),'sessionDate');const present=rows.filter(r=>['PRESENT','LATE'].includes(r.status)).length;
  cards=[{label:'Lượt điểm danh',value:rows.length},{label:'Có mặt / đi muộn',value:present},{label:'Vắng không phép',value:rows.filter(r=>r.status==='ABSENT').length},{label:'Tỷ lệ có mặt',value:rows.length?Math.round(present/rows.length*100):0,suffix:'%'}];
  charts=[{type:'donut',title:'Trạng thái điểm danh',unit:'lượt',data:[['PRESENT','Có mặt','#55bd9b'],['LATE','Đi muộn','#e2bc62'],['ABSENT','Vắng không phép','#e88491'],['EXCUSED','Nghỉ có phép','#a694dc']].map(([id,name,color])=>({id,name,color,value:rows.filter(r=>r.status===id).length}))},{type:'bars',title:'Lượt có mặt theo lớp',unit:'lượt',data:group(rows.filter(r=>['PRESENT','LATE'].includes(r.status)),classId,className)},{type:'bars',title:'Lượt vắng theo lớp',unit:'lượt',data:group(rows.filter(r=>r.status==='ABSENT'),classId,className)},{type:'line',title:'Lượt điểm danh theo tháng',unit:'lượt',data:monthly(rows,'sessionDate')}];
  note='Một học viên tham gia nhiều buổi được tính nhiều lượt. Tỷ lệ có mặt gồm có mặt và đi muộn trên tổng lượt đã ghi nhận.';
 }else if(id==='tuition-report'){
  rows=filter(scoped('invoices',db.invoices),'period');const paid=rows.filter(r=>r.status==='PAID'),unpaid=rows.filter(r=>r.status!=='PAID'),today=new Date().toISOString().slice(0,10),overdue=unpaid.filter(r=>r.dueDate&&r.dueDate<today);
  cards=[{label:'Tổng học phí lập hóa đơn',value:sum(rows,'amount'),money:true},{label:'Đã thanh toán',value:sum(paid,'amount'),money:true},{label:'Chưa thanh toán',value:sum(unpaid,'amount'),money:true},{label:'Quá hạn',value:sum(overdue,'amount'),money:true}];
  charts=[{type:'donut',title:'Tình trạng thanh toán',unit:'đ',money:true,data:[{id:'paid',name:'Đã thanh toán',value:sum(paid,'amount'),color:'#55bd9b'},{id:'due',name:'Chưa đến hạn',value:sum(unpaid,'amount')-sum(overdue,'amount'),color:'#e2bc62'},{id:'overdue',name:'Quá hạn',value:sum(overdue,'amount'),color:'#e88491'}]},{type:'bars',title:'Học phí theo lớp',unit:'đ',money:true,data:group(rows,classId,className,'amount')},{type:'line',title:'Học phí theo tháng thu',unit:'đ',money:true,data:monthly(rows,'period','amount')},{type:'bars',title:'Hóa đơn theo trạng thái',unit:'hóa đơn',data:[{id:'paid',name:'Đã thanh toán',value:paid.length,color:'#55bd9b'},{id:'unpaid',name:'Chưa thanh toán',value:unpaid.length,color:'#e2bc62'}]}];
  note='Số tiền dựa trên hóa đơn học phí; đã thanh toán là hóa đơn có trạng thái Đã thanh toán. Bộ lọc thời gian theo tháng thu.';
 }else if(id==='promotion-report'){
  rows=filter(scoped('belt-history',db['belt-history']),'awardedAt');
  cards=[{label:'Lượt được cấp đai',value:rows.length},{label:'Võ sinh được cấp đai',value:new Set(rows.map(r=>r.studentId)).size},{label:'Lớp có kết quả',value:new Set(rows.map(classId).filter(Boolean)).size},{label:'Cấp đai đã trao',value:new Set(rows.map(r=>r.rankId)).size}];
  charts=[{type:'donut',title:'Phân bố cấp đai đã trao',unit:'lượt',data:db.ranks.map(r=>({id:r.id,name:r.name,color:r.color,value:rows.filter(s=>s.rankId===r.id).length}))},{type:'bars',title:'Lượt cấp đai theo lớp',unit:'lượt',data:group(rows,classId,className)},{type:'line',title:'Lượt cấp đai theo tháng',unit:'lượt',data:monthly(rows,'awardedAt')},{type:'bars',title:'Số võ sinh theo cấp đai đã nhận',unit:'võ sinh',data:db.ranks.map(r=>({id:r.id,name:r.name,color:r.color,value:new Set(rows.filter(s=>s.rankId===r.id).map(s=>s.studentId)).size}))}];
  note='Thống kê từ lịch sử cấp đai, không tính đề xuất chờ duyệt. Phân lớp theo lớp hiện tại của học viên; một người có thể nhận nhiều cấp đai.';
 }else throw Object.assign(new Error('Không tìm thấy báo cáo.'),{status:404});
 return {cards,charts,recordCount:rows.length,classes,note,generatedAt:new Date().toISOString()};
}
