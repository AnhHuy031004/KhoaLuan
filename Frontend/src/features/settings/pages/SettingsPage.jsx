import ExportSystemButton from '../../../components/common/ExportSystemButton.jsx';
import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import config from '../module.js';
import service from '../services/settingsService.js';
export default function SettingsPage() {
  return (
    <>
      <section className="panel">
        <h2>Xuất dữ liệu nghiệp vụ</h2>
        <p>Tải danh sách trong phạm vi quyền để đối chiếu và lưu hồ sơ.</p>
        <ExportSystemButton />
      </section>
      <FeaturePage config={config} service={service} />
    </>
  );
}
