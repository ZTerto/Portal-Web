import React from "react";
import { Link } from "react-router-dom";

/* =====================================================
   Tipos
===================================================== */

type RegisterForm = {
  name: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
};

type Props = {
  form: RegisterForm;
  error: string | null;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

/* =====================================================
   Componente de Render
===================================================== */

export default function Perfil_Render({
  form,
  error,
  loading,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-gray-800">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Si no hay confianza...
        </h1>

        {/* =====================
            Formulario
           ===================== */}
        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Cómo te conocemos?
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              type="text"
              placeholder="Nombre o apodo"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Identificación (DNI / NIE)
            </label>
            <input
              name="dni"
              value={form.dni}
              onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </form>

        {/* =====================
            Error
           ===================== */}
        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        {/* =====================
            Enviar
           ===================== */}
        <div className="mt-6">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="
              w-full rounded-lg
              bg-blue-600 text-white font-semibold
              py-2
              hover:bg-blue-700
            "
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
        </div>

        {/* =====================
            Enlace a login
           ===================== */}
        <div className="mt-6">
          <Link
            to="/perfil/login"
            className="
              block w-full text-center
              rounded-lg
              border border-blue-600
              text-blue-700 font-semibold
              py-2
              hover:bg-blue-50
            "
          >
            ¡Eh! Yo ya existo aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
