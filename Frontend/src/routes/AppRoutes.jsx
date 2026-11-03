import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useSearchParams, Link } from 'react-router-dom';
import OrganizationNavigator from '../features/organization/OrganizationNavigator.jsx';
import { ORGANIZATION_MODULES } from '../features/organization/navigation.js';
import { IS_MOCK } from '../services/api.js';
import ApiPaymentsPage from '../features/payments/pages/ApiPaymentsPage.jsx';
import ApiAttendancePage from '../features/attendance/pages/ApiAttendancePage.jsx';
import ProtectedRoute from '../components/rbac/ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import ProfilePage from '../features/profile/pages/ProfilePage.jsx';
import Loading from '../components/common/Loading.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { getModule } from './routeConfig.js';
import { pages } from './pageRegistry.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { canOpen } from '../utils/permissions.js';

function FeatureRoute() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const [routeQuery] = useSearchParams();
  const module = getModule(moduleId);

  if (!module)
    return (
      <div className="panel">
        <h1>Không tìm thấy trang</h1>
        <Link to="/app/dashboard">Về tổng quan</Link>
      </div>
    );

  if (!canOpen(module, user.role))
    return (
      <ErrorState
        error={{
          status: 403,
          message: 'Chức năng này không nằm trong quyền truy cập của bạn.',
        }}
      />
    );

  if (!IS_MOCK && ['online-payments', 'payment-confirmations'].includes(moduleId))
    return <ApiPaymentsPage confirmCash={moduleId === 'payment-confirmations'} key={moduleId} />;

  if (!IS_MOCK && moduleId === 'attendance' && ['ADMIN', 'INSTRUCTOR'].includes(user.role))
    return <ApiAttendancePage />;

  // Only redirect to organization cards if user is on wards/clubs module and didn't specify record view
  if (IS_MOCK && user.role === 'MASTER' && ['wards', 'clubs'].includes(moduleId) && routeQuery.get('view') !== 'records')
    return <OrganizationNavigator hub />;

  const Page = pages[moduleId];
  // Direct render without gating roadblock: global scope selector in Header and OrganizationScope handle unit context seamlessly
  return <Suspense fallback={<Loading />}><Page key={moduleId} /></Suspense>;
}

function ManagementEntry() {
  const { user } = useAuth();
  const [query] = useSearchParams();
  const moduleId = ORGANIZATION_MODULES.includes(query.get('module')) ? query.get('module') : 'classes';
  return IS_MOCK && ['ADMIN', 'MASTER'].includes(user.role)
    ? <OrganizationNavigator hub moduleId={moduleId} />
    : <Navigate to="/app/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset" element={<ForgotPasswordPage key="reset" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="management" element={<ManagementEntry />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path=":moduleId" element={<FeatureRoute />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}
