import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/evaluationsService.js';
export default function EvaluationsPage() {
  return <FeaturePage config={config} service={service} />;
}
