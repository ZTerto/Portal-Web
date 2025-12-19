import Perfil_Render from "./Perfil_Render";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { validateRegisterForm } from "../utils/validators";

//20251215
// Componente principal de la página de perfil (registro)
export default function Perfil() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    dni: "",
    phone: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/perfil/status");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError(null);

    const validationError = validateRegisterForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate("/perfil/login");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Perfil_Render
      form={form}
      error={error}
      loading={loading}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
