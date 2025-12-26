import React from "react";

/* =====================================================
   Props
===================================================== */

type Props = {
  name: string;
  setName: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

/* =====================================================
   Componente de Render
===================================================== */

export default function PerfilLogin_Render({
  name,
  setName,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}: Props) {
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-gray-800">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Login
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* =====================
              Nombre
             ===================== */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* =====================
              Contraseña
             ===================== */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* =====================
              Error
             ===================== */}
          {error && (
            <p className="text-red-600 text-sm text-center">
              {error}
            </p>
          )}

          {/* =====================
              Enviar
             ===================== */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full rounded-lg
              bg-blue-600 text-white font-semibold
              py-2
              hover:bg-blue-700
              disabled:opacity-50
            "
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
