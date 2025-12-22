import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function BottomBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const hasUser = Boolean(user);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Menú desplegable */}
      {open && (
        <div className="fixed bottom-24 right-4 w-60 bg-gray-800 text-white rounded-lg shadow-xl z-50">
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

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 right-0 h-18 bg-gray-900 text-white flex items-center px-4 z-40">

      {/* Centro — solo si NO hay usuario */}
        {!hasUser && (
          <Link
            to="/perfil"
            className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-blue-300 hover:text-blue-100"
          >
            ¡Identifícate!
          </Link>
        )}


        {/* Centro — usuario logueado */}
        {hasUser && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">

{/* Avatar */}
<div className="w-9 h-9 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold">
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


      {/* Botón menú */}
      <button
        onClick={() => setOpen(!open)}
        className="ml-auto text-2xl select-none focus:outline-none"
        aria-label="Abrir menú"
      >
        ☰
      </button>

      </div>
    </>
  );
}
