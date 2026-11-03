import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/examsService.js';
export default function ExamsPage() {
  return <FeaturePage config={config} service={service} />;
}
