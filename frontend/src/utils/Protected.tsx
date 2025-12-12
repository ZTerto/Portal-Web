import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedAccess({ children }: { children: JSX.Element }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}
