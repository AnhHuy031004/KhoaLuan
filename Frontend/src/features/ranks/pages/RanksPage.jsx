import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/ranksService.js';
export default function RanksPage() {
  return <FeaturePage config={config} service={service} />;
}
