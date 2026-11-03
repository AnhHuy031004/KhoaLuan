import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { api, IS_MOCK } from '../services/api.js';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      if (res?.data) {
        setHierarchy({
          province: res.data.province || null,
          wards: res.data.wards || [],
          clubs: res.data.clubs || [],
          functions: res.data.functions || [],
          loading: false,
        });
      }
    } catch (err) {
      console.error('Failed to load organization hierarchy:', err);
      setHierarchy(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    loadHierarchy();
    const unsubscribe = api.subscribeResource?.('permissions', loadHierarchy);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadHierarchy]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlWard = searchParams.get('wardId');
    const urlClub = searchParams.get('clubId');

    if (isClubLevel) {
      if (user?.wardId && selectedWard !== user.wardId) setSelectedWard(user.wardId);
      if (user?.clubId && selectedClub !== user.clubId) setSelectedClub(user.clubId);
      return;
    }

    if (isWardLevel) {
      if (user?.wardId && selectedWard !== user.wardId) setSelectedWard(user.wardId);
      if (urlClub !== null && urlClub !== selectedClub) {
        setSelectedClub(urlClub);
      }
      return;
    }

    if (urlWard !== null && urlWard !== selectedWard) {
      setSelectedWard(urlWard);
    }
    if (urlClub !== null && urlClub !== selectedClub) {
      setSelectedClub(urlClub);
    }
  }, [location.search, isClubLevel, isWardLevel, user, selectedWard, selectedClub]);

  const switchScope = useCallback((newWardId, newClubId, options = {}) => {
    const ward = isWardLevel || isClubLevel ? user?.wardId : newWardId;
    const club = isClubLevel ? user?.clubId : newClubId;

    setSelectedWard(ward || '');
    setSelectedClub(club || '');

    if (ward) localStorage.setItem('vovinam_active_ward', ward);
    else localStorage.removeItem('vovinam_active_ward');

    if (club) localStorage.setItem('vovinam_active_club', club);
    else localStorage.removeItem('vovinam_active_club');

    const nextParams = new URLSearchParams(location.search);
    if (ward) nextParams.set('wardId', ward);
    else nextParams.delete('wardId');

    if (club) nextParams.set('clubId', club);
    else nextParams.delete('clubId');

    const searchStr = nextParams.toString() ? '?' + nextParams.toString() : '';
    const targetPath = options.navigateTo || location.pathname;

    navigate(targetPath + searchStr, { replace: true });
  }, [isWardLevel, isClubLevel, user, location.search, location.pathname, navigate]);

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

  const value = {
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
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrgScope() {
  const context = useContext(OrganizationContext);
  return context || {};
}
export default OrganizationContext;