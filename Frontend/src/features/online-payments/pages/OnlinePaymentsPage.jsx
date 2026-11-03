import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/onlinePaymentsService.js';
export default function OnlinePaymentsPage() {
  return <FeaturePage config={config} service={service} />;
}
