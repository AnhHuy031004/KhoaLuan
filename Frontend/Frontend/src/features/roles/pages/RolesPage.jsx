import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/rolesService.js';
export default function RolesPage() {
  return <FeaturePage config={config} service={service} />;
}
