import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/usersService.js';
export default function UsersPage() {
  return <FeaturePage config={config} service={service} />;
}
