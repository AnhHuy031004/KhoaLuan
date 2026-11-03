import { useAuth } from '../../contexts/AuthContext.jsx';
import { can } from '../../utils/permissions.js';
export default function PermissionGate({ module, action, children }) {
  const { user } = useAuth();
  return can(module, user?.role, action) ? children : null;
}
