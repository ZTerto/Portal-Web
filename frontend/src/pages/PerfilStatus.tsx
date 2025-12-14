import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

type ApiResponse = {
  message?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    avatar_url?: string;
    score?: number;
    created_at?: string;
    iat?: number;
    exp?: number;
  };
};

export default function PerfilStatus() {
  const { token } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el perfil");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-blue-200">
        Cargando perfil…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        {error}
      </div>
    );
  }

  const user = data?.user;

  if (!user) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        No se han recibido datos de usuario
      </div>
    );
  }

  const avatarLetter = user.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 text-gray-900">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{avatarLetter}</span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              {user.name || "Usuario"}
            </h1>
            <p className="text-sm text-gray-600">
              {user.email || "—"}
            </p>
          </div>

          <div className="ml-auto text-center">
            <p className="text-xs text-gray-500">Puntuación</p>
            <p className="text-2xl font-bold text-indigo-600">
              {user.score ?? 0}
            </p>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-medium bg-gray-50">
                  Nombre
                </td>
                <td className="px-4 py-3">
                  {user.name || "—"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium bg-gray-50">
                  Email
                </td>
                <td className="px-4 py-3">
                  {user.email || "—"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium bg-gray-50">
                  Teléfono
                </td>
                <td className="px-4 py-3">
                  {user.phone || "—"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium bg-gray-50">
                  DNI
                </td>
                <td className="px-4 py-3">
                  {user.dni || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex justify-end">
          <button
            disabled
            className="rounded-lg px-4 py-2 bg-indigo-600 text-white font-semibold opacity-50 cursor-not-allowed"
          >
            Editar perfil (próximamente)
          </button>
        </div>
      </div>
    </div>
  );
}
