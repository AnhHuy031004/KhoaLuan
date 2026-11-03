import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/beltHistoryService.js';
export default function BeltHistoryPage() {
  return <FeaturePage config={config} service={service} />;
}
