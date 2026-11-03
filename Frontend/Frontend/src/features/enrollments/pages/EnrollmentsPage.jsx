import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/enrollmentsService.js';
export default function EnrollmentsPage() {
  return <FeaturePage config={config} service={service} />;
}
