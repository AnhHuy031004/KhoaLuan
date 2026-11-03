// Business transitions. Role rights and organization boundaries are checked separately.
export const workflows = {
  leaves: {title:'Đơn xin nghỉ', initial:'PENDING', actions:{approve:{from:'PENDING',to:'APPROVED'},reject:{from:'PENDING',to:'REJECTED'}}},
  promotions: {title:'Đề xuất thi lên đai', initial:'PENDING', actions:{approve:{from:'PENDING',to:'APPROVED'},reject:{from:'PENDING',to:'REJECTED'}}},
  exams: {title:'Kỳ thi thăng đai', initial:'PENDING', actions:{approve:{from:'PENDING',to:'APPROVED'},reject:{from:'PENDING',to:'REJECTED'}}},
  'exam-results': {title:'Kết quả thi', initial:'PENDING', actions:{approve:{from:'PENDING',to:['PASS','FAIL'],roles:['ADMIN']},reject:{from:'PENDING',to:'REJECTED',roles:['ADMIN']}}},
  discounts: {title:'Miễn giảm học phí', initial:'PENDING', actions:{approve:{from:'PENDING',to:'APPROVED',roles:['ADMIN','MASTER']},reject:{from:'PENDING',to:'REJECTED',roles:['ADMIN','MASTER']}}},
  'online-payments': {title:'Thanh toán học phí', initial:'DRAFT', actions:{process:{from:'DRAFT',to:'PENDING'}}},
  'payment-confirmations': {title:'Xác nhận thanh toán', initial:'PENDING', actions:{approve:{from:'PENDING',to:'SUCCESS'},reject:{from:'PENDING',to:'REJECTED'}}},
  announcements: {title:'Thông báo', initial:'DRAFT', actions:{process:{from:'DRAFT',to:'PUBLISHED'}}},
};

export function assertWorkflowAction(moduleId, action, row, user, method='POST') {
  const reject=(status,message)=>{throw Object.assign(new Error(message),{status});};
  if(method!=='POST')reject(405,'Thao tác xử lý phải dùng phương thức POST.');
  const transition=workflows[moduleId]?.actions[action];
  if(!transition)reject(400,'Hành động không được hỗ trợ trong luồng này.');
  if(transition.roles&&!transition.roles.includes(user.role))reject(403,'Vai trò này không được xử lý bước này.');
  if(row&&row.status!==transition.from)reject(409,'Bản ghi đã được xử lý hoặc không ở trạng thái cho phép. Vui lòng tải lại.');
  return transition;
}
