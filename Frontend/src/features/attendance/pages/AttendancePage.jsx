import React from 'react';
import {useAuth} from '../../../contexts/AuthContext.jsx';
import {IS_MOCK} from '../../../services/api.js';
import SessionAttendancePage from './SessionAttendancePage.jsx';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/attendanceService.js';
export default function AttendancePage() {
  const {user}=useAuth();
  if(IS_MOCK && ['ADMIN','MASTER','INSTRUCTOR'].includes(user.role))return <SessionAttendancePage/>;
  return <FeaturePage config={config} service={service} />;
}
