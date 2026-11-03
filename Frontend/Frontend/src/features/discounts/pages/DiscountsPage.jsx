import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/discountsService.js';
export default function DiscountsPage() {
  return <FeaturePage config={config} service={service} />;
}
