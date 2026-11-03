export default {id:'discounts',title:'Xem xét miễn giảm học phí',group:'TÀI CHÍNH',icon:'BadgeCheck',permissions:{ADMIN:'VA',MASTER:'VA',INSTRUCTOR:'VC',STUDENT:'V'},fields:[
{key:'classId',label:'Lớp học',type:'class',required:true},{key:'studentId',label:'Học viên',type:'student',required:true},
{key:'reliefType',label:'Hình thức đề xuất',type:'select',required:true,options:[['REDUCTION','Giảm học phí'],['EXEMPTION','Miễn toàn bộ học phí']]},
{key:'percent',label:'Mức miễn giảm (%)',type:'percent',required:true},{key:'period',label:'Tháng áp dụng',type:'month',required:true},{key:'reason',label:'Lý do đề xuất',type:'textarea',required:true}],
columns:['studentId','classId','reliefType','percent','period','reason','submittedName','status'],description:'HLV gửi đề xuất cho học viên của lớp. Admin hoặc Võ sư xét duyệt và thông báo kết quả.',endpoint:'/tuition-relief',workflow:true,component:'DiscountsPage'};
