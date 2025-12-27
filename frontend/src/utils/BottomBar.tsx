import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";


/**
 * BottomBar
 * ---------
 * Barra inferior fija con:
 * - Acceso rápido a secciones
 * - Menú desplegable
 * - Información del usuario autenticado
 *
 * Se adapta automáticamente si hay usuario o no.
 */
export default function BottomBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Estado global de autenticación
  const { user, logout } = useAuth();
  const hasUser = Boolean(user);


    /* =========================
     Dark / Light mode
  ========================= */

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  /**
   * Cierra sesión y redirige al inicio
   */
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  /**
   * Alterna el tema claro/oscuro
   * */
  const toggleTheme = () => {
    const html = document.documentElement;

    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
  };


  return (
    <>
      {/* =================================================
          MENÚ DESPLEGABLE
         ================================================= */}
      {open && (
        <div className="fixed bottom-[72px] right-4 w-60 bg-gray-800 text-white rounded-lg shadow-xl z-50">
          <nav className="flex flex-col divide-y divide-gray-700">
            <Link
              to="/"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Inicio
            </Link>

            <Link
              to="/perfil"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Perfil
            </Link>

            <Link
              to="/miembros"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Miembros
            </Link>

            <Link
              to="/logros"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Logros
            </Link>

            <Link
              to="/actividades"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Actividades
            </Link>

            <Link
              to="/calendario"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Calendario
            </Link>

            <Link
              to="/ludoteca"
              className="px-4 py-3 hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              Ludoteca
            </Link>
          </nav>
        </div>
      )}

      {/* =================================================
          BARRA INFERIOR FIJA
         ================================================= */}
      <div className="fixed bottom-0 left-0 right-0 h-18 bg-gray-900 text-white flex items-center px-4 z-40">

        {/* Centro — usuario NO autenticado */}
        {!hasUser && (
          <Link
            to="/perfil"
            className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-blue-300 hover:text-blue-100"
          >
            ¡Identifícate!
          </Link>
        )}

        {/* Centro — usuario autenticado */}
        {hasUser && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">

            {/* Avatar del usuario */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold">
              {user?.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>

            {/* Nombre + logout */}
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold">
                {user?.name}
              </span>

              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-300 text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        

        {/* Acciones derecha: dark/light + menú */}
        <div className="ml-auto flex items-center gap-5">

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="
              w-10 h-10
              rounded-full
              flex items-center justify-center
              border border-white/30
              text-lg
              hover:bg-white/10
              transition
              focus:outline-none
            "
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Botón menú */}
          <button
            onClick={() => setOpen(!open)}
            className="text-3xl p-1 select-none focus:outline-none"
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>
      </div>
    </>
  );
}

