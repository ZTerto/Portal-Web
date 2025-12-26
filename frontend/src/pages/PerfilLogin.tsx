import PerfilLogin_Render from "./PerfilLogin_Render";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

/**
 * PerfilLogin
 * -----------
 * Página de inicio de sesión.
 *
 * RESPONSABILIDADES:
 * - Gestionar formulario de login
 * - Llamar a login() del AuthContext
 * - Manejar estados de error y carga
 * - Redirigir tras login exitoso
 *
 */
export default function PerfilLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  /* =========================
     Estado del formulario
  ========================= */

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  /* =========================
     Envío del formulario
  ========================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await login(name, password);
      navigate("/");
    } catch (err: any) {
      setError(
        err.message || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Render
  ========================= */

  return (
    <PerfilLogin_Render
      name={name}
      setName={setName}
      password={password}
      setPassword={setPassword}
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
}
