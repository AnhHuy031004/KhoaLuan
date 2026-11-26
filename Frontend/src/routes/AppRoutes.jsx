import React, { Suspense, lazy } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useSearchParams,
  Link,
} from 'react-router-dom';
import { ORGANIZATION_MODULES } from '../features/organization/navigation.js';
import ProtectedRoute from '../components/rbac/ProtectedRoute.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import Loading from '../components/common/Loading.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { getModule } from './routeConfig.js';
import { pages } from './pageRegistry.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { canOpen } from '../utils/permissions.js';

const ForgotPasswordPage = lazy(
  () => import('../features/auth/pages/ForgotPasswordPage.jsx'),
);
const MainLayout = lazy(() => import('../components/layout/MainLayout.jsx'));
const DashboardPage = lazy(
  () => import('../features/dashboard/pages/DashboardPage.jsx'),
);
const UnifiedReportsPage = lazy(
  () => import('../components/reports/UnifiedReportsPage.jsx'),
);
const StudentBeltJourneyPage = lazy(
  () => import('../features/belt-journey/pages/StudentBeltJourneyPage.jsx'),
);
const ProfilePage = lazy(
  () => import('../features/profile/pages/ProfilePage.jsx'),
);
const OrganizationNavigator = lazy(
  () => import('../features/organization/OrganizationNavigator.jsx'),
);

function FeatureRoute() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const [routeQuery] = useSearchParams();
  const module = getModule(moduleId);

  if (!module)
    return (
      <div className="panel">
        <h1>404 · Không tìm thấy trang</h1>
        <Link to="/app/dashboard">Về tổng quan</Link>
        <button onClick={() => window.history.back()}>Quay lại</button>
      </div>
    );

  if (!canOpen(module, user.role))
    return (
      <div className="panel" style={{ maxWidth: 640, margin: '24px auto', padding: 28 }}>
        <ErrorState
          error={{
            status: 403,
            message:
              'Chức năng này không nằm trong quyền truy cập của vai trò hiện tại. Nếu bạn cần mở quyền hoặc xử lý nghiệp vụ vượt cấp, vui lòng liên hệ quản trị viên võ đường.',
          }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/app/dashboard">
            Về trang tổng quan
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    );

  if (
    user.role === 'MASTER' &&
    ['wards', 'clubs'].includes(moduleId) &&
    routeQuery.get('view') !== 'records'
  )
    return (
      <Suspense fallback={<Loading />}>
        <OrganizationNavigator hub />
      </Suspense>
    );

  const Page = pages[moduleId];
  return (
    <Suspense fallback={<Loading />}>
      <Page key={moduleId} />
    </Suspense>
  );
}

function ManagementEntry() {
  const { user } = useAuth();
  const [query] = useSearchParams();
  const moduleId = ORGANIZATION_MODULES.includes(query.get('module'))
    ? query.get('module')
    : 'classes';
  return ['ADMIN', 'MASTER'].includes(user.role) ? (
    <Suspense fallback={<Loading />}>
      <OrganizationNavigator hub moduleId={moduleId} />
    </Suspense>
  ) : (
    <Navigate to="/app/dashboard" replace />
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading fullScreen label="Đang tải giao diện…" />}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        <Route
          path="/auth/reset"
          element={<ForgotPasswordPage key="reset" />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reports" element={<UnifiedReportsPage />} />
            <Route path="belt-journey" element={<StudentBeltJourneyPage />} />
            <Route path="management" element={<ManagementEntry />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path=":moduleId" element={<FeatureRoute />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="*"
          element={
            <div className="startup">
              <h1>404 · Không tìm thấy trang</h1>
              <p>Đường dẫn không tồn tại hoặc đã thay đổi.</p>
              <Link className="btn" to="/app/dashboard">
                Về tổng quan
              </Link>
              <button onClick={() => window.history.back()}>Quay lại</button>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
