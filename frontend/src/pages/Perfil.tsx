import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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


/* =========================
   Render
========================= */
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-gray-800">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Si no hay confianza...
        </h1>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Cómo te conocemos?
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="Nombre o apodo"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              DNI (o NIE)
            </label>
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              type="text"
              placeholder="12345678A"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Teléfono
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              placeholder="600 000 000"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </div>

        <p className="mt-6 text-base italic text-gray-700 leading-relaxed">
          Esta información es exclusivamente para gestionar la organización de
          las jornadas. Si sigues teniendo dudas pero igualmente quieres
          registrarte habla con Terto. ¿Dónde encuentro a Terto? Si has
          llegado aquí sabes de sobra cómo contactar con esa persona...
        </p>

        <div className="mt-6">
          <Link
            to="/perfil/login"
            className="block w-full text-center rounded-lg border border-blue-600 text-blue-700 font-semibold py-2 hover:bg-blue-50"
          >
            ¡Eh! Yo ya existo aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
