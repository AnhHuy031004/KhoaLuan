import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/studentsService.js';
export default function StudentsPage() {
  return <FeaturePage config={config} service={service} />;
}
