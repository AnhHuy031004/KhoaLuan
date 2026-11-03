import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, IS_MOCK } from '../services/api.js';
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

  const location = useLocation();
  const navigate = useNavigate();

  // --- Quản lý phạm vi đơn vị (Scope & Organization Hierarchy) ---
  const isProvincial = user?.role === 'ADMIN' || (user?.role === 'MASTER' && (!user?.masterLevel || user?.masterLevel === 'PROVINCE'));
  const isWardLevel = user?.role === 'MASTER' && user?.masterLevel === 'WARD';
  const isClubLevel = user?.role === 'MASTER' && user?.masterLevel === 'CLUB';

  const [hierarchy, setHierarchy] = useState({
    province: null,
    wards: [],
    clubs: [],
    functions: [],
    loading: true,
  });

  const getInitialScope = useCallback(() => {
    if (typeof window === 'undefined') return { wardId: '', clubId: '' };
    const urlParams = new URLSearchParams(window.location.search);
    const urlWard = urlParams.get('wardId');
    const urlClub = urlParams.get('clubId');

    if (isClubLevel) {
      return { wardId: user?.wardId || '', clubId: user?.clubId || '' };
    }
    if (isWardLevel) {
      const wardId = user?.wardId || '';
      const savedClub = urlClub || localStorage.getItem('vovinam_active_club') || '';
      return { wardId, clubId: savedClub };
    }

    const savedWard = urlWard !== null ? urlWard : (localStorage.getItem('vovinam_active_ward') || '');
    const savedClub = urlClub !== null ? urlClub : (localStorage.getItem('vovinam_active_club') || '');
    return { wardId: savedWard, clubId: savedClub };
  }, [user, isClubLevel, isWardLevel]);

  const [selectedWard, setSelectedWard] = useState(() => getInitialScope().wardId);
  const [selectedClub, setSelectedClub] = useState(() => getInitialScope().clubId);

  const loadHierarchy = useCallback(async () => {
    if (!IS_MOCK || !user || !['ADMIN', 'MASTER'].includes(user.role)) {
      setHierarchy(prev => ({ ...prev, loading: false }));
      return;
    }
    try {
      const res = await api.request('/organization/navigation', { query: { module: 'classes' } });
      const payload = res?.data || res;
      if (payload && (payload.wards || payload.clubs)) {
        setHierarchy({
          province: payload.province || null,
          wards: payload.wards || [],
          clubs: payload.clubs || [],
          functions: payload.functions || [],
          loading: false,
        });
      }
    } catch (err) {
      setHierarchy(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadHierarchy();
      const initial = getInitialScope();
      setSelectedWard(initial.wardId);
      setSelectedClub(initial.clubId);
    }
    const off = api.subscribeResource?.('permissions', loadHierarchy);
    return () => { off?.(); };
  }, [user?.id, loadHierarchy, getInitialScope]);

  // Đồng bộ URL search params với state khi người dùng bấm nút hoặc chuyển trang
  useEffect(() => {
    if (!user?.id) return;
    const searchParams = new URLSearchParams(location.search);
    const urlWard = searchParams.get('wardId');
    const urlClub = searchParams.get('clubId');

    if (isClubLevel) {
      if (user.wardId && selectedWard !== user.wardId) setSelectedWard(user.wardId);
      if (user.clubId && selectedClub !== user.clubId) setSelectedClub(user.clubId);
      return;
    }
    if (isWardLevel) {
      if (user.wardId && selectedWard !== user.wardId) setSelectedWard(user.wardId);
      if (urlClub !== null && urlClub !== selectedClub) setSelectedClub(urlClub);
      return;
    }
    if (urlWard !== null && urlWard !== selectedWard) setSelectedWard(urlWard);
    if (urlClub !== null && urlClub !== selectedClub) setSelectedClub(urlClub);
  }, [location.search, user, isClubLevel, isWardLevel, selectedWard, selectedClub]);

  const switchScope = useCallback((newWardId, newClubId, options = {}) => {
    let ward = isWardLevel || isClubLevel ? user?.wardId : newWardId;
    const club = isClubLevel ? user?.clubId : newClubId;

    // Nếu chọn trực tiếp 1 CLB khi đang ở chế độ Toàn tỉnh, tự động suy ra Phường của CLB đó
    if (club && !ward) {
      const foundClub = hierarchy.clubs.find(c => c.id === club);
      if (foundClub?.wardId) ward = foundClub.wardId;
    }

    setSelectedWard(ward || '');
    setSelectedClub(club || '');

    if (typeof localStorage !== 'undefined') {
      if (ward) localStorage.setItem('vovinam_active_ward', ward);
      else localStorage.removeItem('vovinam_active_ward');

      if (club) localStorage.setItem('vovinam_active_club', club);
      else localStorage.removeItem('vovinam_active_club');
    }

    const nextParams = new URLSearchParams(location.search);
    if (ward) nextParams.set('wardId', ward);
    else nextParams.delete('wardId');

    if (club) nextParams.set('clubId', club);
    else nextParams.delete('clubId');

    const searchStr = nextParams.toString() ? '?' + nextParams.toString() : '';
    const targetPath = options.navigateTo || location.pathname;

    navigate(targetPath + searchStr, { replace: true });
  }, [isWardLevel, isClubLevel, user, hierarchy.clubs, location.search, location.pathname, navigate]);

  const activeWard = useMemo(() => {
    return hierarchy.wards.find(w => w.id === selectedWard) || null;
  }, [hierarchy.wards, selectedWard]);

  const activeClub = useMemo(() => {
    return hierarchy.clubs.find(c => c.id === selectedClub) || null;
  }, [hierarchy.clubs, selectedClub]);

  const availableClubs = useMemo(() => {
    if (selectedWard) {
      return hierarchy.clubs.filter(c => c.wardId === selectedWard);
    }
    return hierarchy.clubs;
  }, [hierarchy.clubs, selectedWard]);

  const scopeStats = useMemo(() => {
    if (activeClub) {
      return {
        classCount: activeClub.classCount || 0,
        studentCount: activeClub.studentCount || 0,
        clubCount: 1,
      };
    }
    if (activeWard) {
      return {
        classCount: activeWard.classCount || 0,
        studentCount: activeWard.studentCount || 0,
        clubCount: activeWard.clubCount || 0,
      };
    }
    const totalClasses = hierarchy.clubs.reduce((acc, c) => acc + (c.classCount || 0), 0);
    const totalStudents = hierarchy.clubs.reduce((acc, c) => acc + (c.studentCount || 0), 0);
    return {
      classCount: totalClasses,
      studentCount: totalStudents,
      clubCount: hierarchy.clubs.length,
      wardCount: hierarchy.wards.length,
    };
  }, [activeClub, activeWard, hierarchy.clubs, hierarchy.wards]);
  // --- Kết thúc phần Scope ---

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
        hierarchy,
        selectedWard,
        selectedClub,
        activeWard,
        activeClub,
        availableClubs,
        scopeStats,
        isProvincial,
        isWardLevel,
        isClubLevel,
        switchScope,
        reloadHierarchy: loadHierarchy,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => useContext(Context);
export const useOrgScope = () => useContext(Context);
export const OrganizationProvider = ({ children }) => children;
export default Context;
