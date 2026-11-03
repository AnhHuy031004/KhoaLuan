import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/leavesService.js';
export default function LeavesPage() {
  return <FeaturePage config={config} service={service} />;
}
