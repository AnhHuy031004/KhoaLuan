import { useAuth } from '../../contexts/AuthContext.jsx';
export default function RoleGate({ roles, children }) {
  return roles.includes(useAuth().user?.role) ? children : null;
}
