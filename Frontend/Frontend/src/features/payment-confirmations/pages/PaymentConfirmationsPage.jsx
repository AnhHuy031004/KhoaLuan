import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/paymentConfirmationsService.js';
export default function PaymentConfirmationsPage() {
  return <FeaturePage config={config} service={service} />;
}
