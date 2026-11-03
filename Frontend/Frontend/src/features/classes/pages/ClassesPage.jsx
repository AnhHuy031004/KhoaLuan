import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/classesService.js';
export default function ClassesPage() {
  return <FeaturePage config={config} service={service} />;
}
