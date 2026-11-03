import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { modules } from '../routes/routeConfig.js';
import { ROLES } from '../utils/permissions.js';
const Context = createContext(null);
const BASE_PERMISSIONS = Object.fromEntries(
  modules.map((m) => [m.id, { ...m.permissions }]),
);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  async function refreshPermissions() {
    const data = await api.request('/permissions');
    for (const m of modules)
      if (data.matrix[m.id]) m.permissions = { ...data.matrix[m.id] };
    for (const r of data.roles) ROLES[r.code] = r.name;
    setUser((v) => (v ? { ...v } : v));
    return data;
  }
  const expire = () => {
    api.clear();
    for (const m of modules)
      if (BASE_PERMISSIONS[m.id]) m.permissions = { ...BASE_PERMISSIONS[m.id] };
    setUser(null);
  };
  const boot = async () => {
    setError(null);
    setLoading(true);
    try {
      if (api.read()?.tokens?.accessToken) {
        const current = await api.request('/auth/me');
        await refreshPermissions();
        setUser(current);
        api.save({ ...api.read(), user: current });
      }
    } catch (e) {
      if (e.status === 401) expire();
      else setError(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    boot();
    window.addEventListener('vovinam:expired', expire);
    return () => window.removeEventListener('vovinam:expired', expire);
  }, []);
  useEffect(() => {
    if (!user?.id || !api.subscribeResource) return;
    let active = true;
    const sync = async () => {
      try {
        const current = await api.request('/auth/me');
        if (!active) return;
        await refreshPermissions();
        if (active) {
          setUser(current);
          api.save({ ...api.read(), user: current });
        }
      } catch (e) {
        if (e.status === 401) expire();
      }
    };
    const off = api.subscribeResource('permissions', sync);
    return () => {
      active = false;
      off?.();
    };
  }, [user?.id]);
  async function accept(data) {
    if (!data.tokens?.accessToken || !data.tokens?.refreshToken || !data.user)
      throw Error('Phản hồi đăng nhập thiếu thông tin phiên.');
    api.save(data);
    await refreshPermissions();
    setUser(data.user);
    return data.user;
  }
  async function login(body) {
    const data = await api.request('/auth/login', {
      method: 'POST',
      body,
      public: true,
    });
    if (data.mfaRequired) return data;
    return accept(data);
  }
  async function verifyMfa(body) {
    return accept(
      await api.request('/auth/mfa/login-verify', {
        method: 'POST',
        body,
        public: true,
      }),
    );
  }
  async function logout() {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } finally {
      expire();
    }
  }
  const updateUser = (u) => {
    setUser(u);
    api.save({ ...api.read(), user: u });
  };
  return (
    <Context.Provider
      value={{
        user,
        loading,
        error,
        retry: boot,
        login,
        verifyMfa,
        logout,
        updateUser,
        refreshPermissions,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
