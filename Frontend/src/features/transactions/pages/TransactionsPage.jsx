import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/transactionsService.js';
export default function TransactionsPage() {
  return <FeaturePage config={config} service={service} />;
}
