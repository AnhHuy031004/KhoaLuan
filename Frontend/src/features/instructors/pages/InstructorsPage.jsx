import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/instructorsService.js';
export default function InstructorsPage() {
  return <FeaturePage config={config} service={service} />;
}
