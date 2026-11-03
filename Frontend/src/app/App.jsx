import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthProvider.jsx";
import AuthPage from "../features/auth/pages/AuthPage.jsx";
import Dashboard from "../features/dashboard/pages/DashboardPage.jsx";
import "../shared/styles/global.css";
import Guard from "./routes/ProtectedRoute.jsx";
import ModuleRoute from "./routes/ModuleRoute.jsx";
import Boundary from "./ErrorBoundary.jsx";
function AuthRoute() {
  const loc = useLocation();
  return <AuthPage key={loc.pathname + loc.search} />;
}
export default function App() {
  return <Boundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/auth/:mode" element={<AuthRoute />} />
            <Route path="/app" element={<Guard />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path=":moduleId" element={<ModuleRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </Boundary>;
}
