import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/examResultsService.js';
export default function ExamResultsPage() {
  return <FeaturePage config={config} service={service} />;
}
