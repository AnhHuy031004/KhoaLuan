import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/mastersService.js';
export default function MastersPage() {
  return <FeaturePage config={config} service={service} />;
}
