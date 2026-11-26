import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
export default function MainLayout() {
  const [open, setOpen] = useState(false),
    location = useLocation(),
    ref = useRef(null);
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 900px)').matches,
  );
  const closeMenu = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = (event) => {
      setMobile(event.matches);
      if (!event.matches) setOpen(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    setOpen(false);
    ref.current?.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#page-content">
        Đến nội dung chính
      </a>
      <Sidebar open={open} mobile={mobile} onClose={closeMenu} />
      <main
        className="workspace"
        ref={ref}
        inert={mobile && open ? true : undefined}
      >
        <Header menuOpen={open} onMenu={() => setOpen((v) => !v)} />
        <div className="workspace-body" id="page-content" tabIndex={-1}>
          <div
            key={location.key}
            className="route-transition"
            aria-hidden="true"
          />
          <div key={location.pathname} className="page-enter">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
