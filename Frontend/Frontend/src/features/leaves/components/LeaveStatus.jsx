import React from 'react';
import {leaveReviewStatus} from '../reviewStatus.js';
export default function LeaveStatus({row}) {
 const status=leaveReviewStatus(row);
 return <span className="leave-review-status"><span className={'badge badge-'+String(row.status).toLowerCase()}><i/>{status.label}</span>{status.processed&&<><span className="leave-review-name">{status.name||'Chưa có thông tin người xử lý'}</span>{status.at&&<small>{new Date(status.at).toLocaleString('vi-VN')}</small>}</>}</span>;
}
