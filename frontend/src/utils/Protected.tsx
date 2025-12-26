import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * ProtectedAccess
 * ----------------
 * Componente guardián de rutas.
 *
 * RESPONSABILIDAD:
 * - Permitir acceso solo a usuarios autenticados
 *
 * La autorización (admin / organizer) se gestiona
 * dentro de los propios componentes o vistas.
 */
export default function ProtectedAccess({
  children,
}: {
  children: JSX.Element;
}) {
  const { token } = useAuth();

  // Si no hay token, el usuario no está autenticado
  if (!token) {
    return <Navigate to="/perfil" replace />;
  }

  // Usuario autenticado → permitir acceso
  return children;
}
