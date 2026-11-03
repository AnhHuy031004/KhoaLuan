import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/tuitionService.js';
export default function TuitionPage() {
  return <FeaturePage config={config} service={service} />;
}
