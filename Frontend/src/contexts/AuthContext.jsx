import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { modules } from '../routes/routeConfig.js';
import { ROLES } from '../utils/permissions.js';

const Context = createContext(null);
const BASE_PERMISSIONS = Object.fromEntries(
  modules.map((m) => [m.id, { ...m.permissions }]),
);

const emptyHierarchy = (ownerKey = '', loading = false) => ({
  ownerKey,
  province: null,
  wards: [],
  clubs: [],
  functions: [],
  loading,
  error: null,
});
const storedScopeKey = (kind, userId) =>
  'vovinam_active_' + kind + ':' + userId;
const BASE_ROLES = { ...ROLES };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);

  const identityKey = user
    ? [user.id, user.role, user.masterLevel, user.wardId, user.clubId].join(':')
    : '';
  const identityRef = useRef(identityKey),
    userRef = useRef(user),
    hierarchyRequest = useRef(0),
    authEpoch = useRef(0);
  identityRef.current = identityKey;
  userRef.current = user;
  const location = useLocation();
  const navigate = useNavigate();

  // --- Quản lý phạm vi đơn vị (Scope & Organization Hierarchy) ---
  const isProvincial =
    user?.role === 'ADMIN' ||
    (user?.role === 'MASTER' &&
      (!user?.masterLevel || user?.masterLevel === 'PROVINCE'));
  const isWardLevel = user?.role === 'MASTER' && user?.masterLevel === 'WARD';
  const isClubLevel = user?.role === 'MASTER' && user?.masterLevel === 'CLUB';

  const [hierarchyState, setHierarchy] = useState(() =>
    emptyHierarchy('', true),
  );
  const hierarchy =
    hierarchyState.ownerKey === identityKey
      ? hierarchyState
      : emptyHierarchy(
          identityKey,
          Boolean(user && ['ADMIN', 'MASTER'].includes(user.role)),
        );

  const [selectedWard, setSelectedWard] = useState(''),
    [selectedClub, setSelectedClub] = useState('');

  const loadHierarchy = useCallback(async () => {
    const ticket = ++hierarchyRequest.current,
      key = identityKey;
    if (!user || !['ADMIN', 'MASTER'].includes(user.role)) {
      setHierarchy(emptyHierarchy(key));
      return;
    }
    setHierarchy((previous) =>
      previous.ownerKey === key
        ? { ...previous, loading: true, error: null }
        : emptyHierarchy(key, true),
    );
    try {
      const payload = await api.request('/organization/navigation', {
        query: { module: 'classes' },
      });
      if (ticket !== hierarchyRequest.current || identityRef.current !== key)
        return;
      if (!Array.isArray(payload.wards) || !Array.isArray(payload.clubs))
        throw Error('Không tải được danh sách đơn vị.');
      setHierarchy({
        ...payload,
        ownerKey: key,
        province: payload.province || null,
        functions: payload.functions || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      if (ticket === hierarchyRequest.current && identityRef.current === key)
        setHierarchy({ ...emptyHierarchy(key), error });
    }
  }, [identityKey]);

  useEffect(() => {
    if (user?.id) {
      loadHierarchy();
    }
    const off = api.subscribeResource?.('permissions', loadHierarchy);
    return () => {
      off?.();
    };
  }, [identityKey, loadHierarchy]);

  // Đồng bộ URL search params với state khi đường dẫn URL thay đổi (chỉ phụ thuộc vào location.search, không phụ thuộc ngược vào state để tránh ghi đè khi bấm nút Xem tất cả)
  useEffect(() => {
    if (!user?.id) return;
    const searchParams = new URLSearchParams(location.search);
    const urlWard = searchParams.get('wardId');
    const urlClub = searchParams.get('clubId');
    if (!['ADMIN', 'MASTER'].includes(user.role)) {
      setSelectedWard('');
      setSelectedClub('');
      if (urlWard || urlClub) {
        for (const key of [
          'wardId',
          'clubId',
          'classId',
          'page',
          'record',
          'session',
        ])
          searchParams.delete(key);
        navigate(
          location.pathname +
            (searchParams.size ? '?' + searchParams.toString() : ''),
          { replace: true },
        );
      }
      return;
    }

    if (isClubLevel) {
      setSelectedWard(user.wardId || '');
      setSelectedClub(user.clubId || '');
      return;
    }
    if (isWardLevel) {
      setSelectedWard(user.wardId || '');
      if (urlClub !== null) setSelectedClub(urlClub);
      return;
    }
    setSelectedWard(
      urlWard !== null
        ? urlWard
        : localStorage.getItem(storedScopeKey('ward', user?.id)) || '',
    );
    setSelectedClub(
      urlClub !== null
        ? urlClub
        : localStorage.getItem(storedScopeKey('club', user?.id)) || '',
    );
  }, [
    location.search,
    identityKey,
    user?.id,
    user?.wardId,
    user?.clubId,
    isClubLevel,
    isWardLevel,
  ]);

  useEffect(() => {
    if (
      !user ||
      !['ADMIN', 'MASTER'].includes(user.role) ||
      hierarchy.loading ||
      hierarchy.error ||
      hierarchy.ownerKey !== identityKey
    )
      return;
    let ward = isWardLevel || isClubLevel ? user.wardId || '' : selectedWard;
    let club = isClubLevel ? user.clubId || '' : selectedClub;
    if (ward && !hierarchy.wards.some((item) => item.id === ward)) ward = '';
    if (
      club &&
      !hierarchy.clubs.some(
        (item) => item.id === club && (!ward || item.wardId === ward),
      )
    )
      club = '';
    if (ward === selectedWard && club === selectedClub) return;
    setSelectedWard(ward);
    setSelectedClub(club);
    localStorage.setItem(storedScopeKey('ward', user.id), ward);
    localStorage.setItem(storedScopeKey('club', user.id), club);
    const next = new URLSearchParams(location.search);
    for (const key of [
      'wardId',
      'clubId',
      'classId',
      'page',
      'record',
      'session',
    ])
      next.delete(key);
    if (ward) next.set('wardId', ward);
    if (club) next.set('clubId', club);
    navigate(location.pathname + (next.size ? '?' + next.toString() : ''), {
      replace: true,
    });
  }, [
    identityKey,
    hierarchy.loading,
    hierarchy.error,
    hierarchy.wards,
    hierarchy.clubs,
    selectedWard,
    selectedClub,
  ]);

  // Nếu người dùng vào trang chưa có ?wardId / ?clubId nhưng trong phiên đang chọn đơn vị, tự động đồng bộ lên URL để lọc dữ liệu nhất quán
  useEffect(() => {
    if (
      !user?.id ||
      !['ADMIN', 'MASTER'].includes(user.role) ||
      !location.pathname.startsWith('/app/') ||
      hierarchy.loading ||
      hierarchy.error
    )
      return;
    if (
      (selectedWard &&
        !hierarchy.wards.some((item) => item.id === selectedWard)) ||
      (selectedClub &&
        !hierarchy.clubs.some((item) => item.id === selectedClub))
    )
      return;
    const searchParams = new URLSearchParams(location.search);
    let changed = false;
    if (selectedWard && !searchParams.get('wardId')) {
      searchParams.set('wardId', selectedWard);
      changed = true;
    }
    if (selectedClub && !searchParams.get('clubId')) {
      searchParams.set('clubId', selectedClub);
      changed = true;
    }
    if (changed) {
      navigate(location.pathname + '?' + searchParams.toString(), {
        replace: true,
      });
    }
  }, [location.pathname, user?.id, hierarchy.loading]);

  const switchScope = useCallback(
    (newWardId, newClubId, options = {}) => {
      let ward = isWardLevel || isClubLevel ? user?.wardId : newWardId;
      const club = isClubLevel ? user?.clubId : newClubId;

      // Nếu chọn trực tiếp 1 CLB khi đang ở chế độ Toàn tỉnh, tự động suy ra Phường của CLB đó
      if (club && !ward) {
        const foundClub = hierarchy.clubs.find((c) => c.id === club);
        if (foundClub?.wardId) ward = foundClub.wardId;
      }

      if (typeof localStorage !== 'undefined') {
        if (ward) localStorage.setItem(storedScopeKey('ward', user.id), ward);
        else localStorage.removeItem(storedScopeKey('ward', user.id));

        if (club) localStorage.setItem(storedScopeKey('club', user.id), club);
        else localStorage.removeItem(storedScopeKey('club', user.id));
      }

      const nextParams = new URLSearchParams(location.search);
      if ((ward || '') !== selectedWard || (club || '') !== selectedClub) {
        for (const key of ['classId', 'page', 'record', 'session'])
          nextParams.delete(key);
      }
      if (ward) nextParams.set('wardId', ward);
      else nextParams.delete('wardId');

      if (club) nextParams.set('clubId', club);
      else nextParams.delete('clubId');

      const searchStr = nextParams.toString()
        ? '?' + nextParams.toString()
        : '';
      const targetPath = options.navigateTo || location.pathname;

      navigate(targetPath + searchStr, { replace: true });
    },
    [
      isWardLevel,
      isClubLevel,
      user,
      hierarchy.clubs,
      location.search,
      location.pathname,
      navigate,
      selectedWard,
      selectedClub,
    ],
  );

  const activeWard = useMemo(() => {
    return hierarchy.wards.find((w) => w.id === selectedWard) || null;
  }, [hierarchy.wards, selectedWard]);

  const activeClub = useMemo(() => {
    return hierarchy.clubs.find((c) => c.id === selectedClub) || null;
  }, [hierarchy.clubs, selectedClub]);

  const availableClubs = useMemo(() => {
    if (selectedWard) {
      return hierarchy.clubs.filter((c) => c.wardId === selectedWard);
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
    const totalClasses = hierarchy.clubs.reduce(
      (acc, c) => acc + (c.classCount || 0),
      0,
    );
    const totalStudents = hierarchy.clubs.reduce(
      (acc, c) => acc + (c.studentCount || 0),
      0,
    );
    return {
      classCount: totalClasses,
      studentCount: totalStudents,
      clubCount: hierarchy.clubs.length,
      wardCount: hierarchy.wards.length,
    };
  }, [activeClub, activeWard, hierarchy.clubs, hierarchy.wards]);
  // --- Kết thúc phần Scope ---

  async function refreshPermissions() {
    const epoch = authEpoch.current,
      owner = api.read()?.user?.id;
    const data = await api.request('/permissions');
    if (
      epoch !== authEpoch.current ||
      !api.read()?.tokens?.accessToken ||
      api.read()?.user?.id !== owner
    )
      return data;
    for (const m of modules)
      if (data.matrix[m.id]) m.permissions = { ...data.matrix[m.id] };
    for (const r of data.roles) ROLES[r.code] = r.name;
    setUser((v) => (v ? { ...v } : v));
    return data;
  }
  const expire = () => {
    const id = api.read()?.user?.id || userRef.current?.id;
    authEpoch.current++;
    hierarchyRequest.current++;
    for (const key of [
      'vovinam_active_ward',
      'vovinam_active_club',
      storedScopeKey('ward', id),
      storedScopeKey('club', id),
    ])
      localStorage.removeItem(key);
    setHierarchy(emptyHierarchy());
    setSelectedWard('');
    setSelectedClub('');
    for (const key of Object.keys(ROLES)) delete ROLES[key];
    Object.assign(ROLES, BASE_ROLES);
    api.clear();
    for (const m of modules)
      if (BASE_PERMISSIONS[m.id]) m.permissions = { ...BASE_PERMISSIONS[m.id] };
    setUser(null);
  };
  const boot = async () => {
    const epoch = authEpoch.current;
    setError(null);
    setLoading(true);
    try {
      if (api.read()?.tokens?.accessToken) {
        const current = await api.request('/auth/me');
        await refreshPermissions();
        if (epoch !== authEpoch.current) return;
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
      const epoch = authEpoch.current;
      try {
        const current = await api.request('/auth/me');
        if (!active) return;
        await refreshPermissions();
        if (active && epoch === authEpoch.current) {
          setUser(current);
          api.save({ ...api.read(), user: current });
        }
      } catch (e) {
        if (e.status === 401 && active && epoch === authEpoch.current) expire();
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
    const epoch = ++authEpoch.current;
    hierarchyRequest.current++;
    setHierarchy(emptyHierarchy('', true));
    setSelectedWard('');
    setSelectedClub('');
    api.save(data);
    await refreshPermissions();
    if (epoch !== authEpoch.current)
      throw Error('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.');
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
