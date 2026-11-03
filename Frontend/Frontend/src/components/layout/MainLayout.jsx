import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
export default function MainLayout() {
  const [open, setOpen] = useState(false),
    location = useLocation(),
    ref = useRef(null);
  useEffect(() => {
    setOpen(false);
    ref.current?.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="workspace" ref={ref}>
        <Header onMenu={() => setOpen((v) => !v)} />
        <div className="workspace-body">
          <div key={location.key} className="route-transition" aria-hidden="true" />
          <div key={location.pathname} className="page-enter">
          <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
