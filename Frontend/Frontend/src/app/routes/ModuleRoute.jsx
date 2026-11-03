import React, { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { getModule } from "../moduleRegistry.js";
import { featurePages } from "../pageRegistry.js";
import { ErrorState, Loading } from "../../shared/components/index.jsx";
export default function ModuleRoute() {
  const {
    moduleId
  } = useParams();
  const {
    user
  } = useAuth();
  const module = getModule(moduleId);
  if (!module) return <section className="panel"><h1>Không tìm thấy trang</h1><Link to="/app/dashboard">Về tổng quan</Link></section>;
  if (!module.roles.includes(user.role)) return <ErrorState error={{
    status: 403
  }} />;
  const Page = featurePages[module.id];
  return <Suspense fallback={<Loading />}><Page key={module.id} /></Suspense>;
}
