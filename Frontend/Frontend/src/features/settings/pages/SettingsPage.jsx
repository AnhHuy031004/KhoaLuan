import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/settingsService.js';
export default function SettingsPage() {
  return <FeaturePage config={config} service={service} />;
}
