import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/schedulesService.js';
export default function SchedulesPage() {
  return <FeaturePage config={config} service={service} />;
}
