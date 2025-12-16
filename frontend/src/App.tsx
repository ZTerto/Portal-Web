import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext";

//20251215
// Barra de abajo y protección de acceso
import BottomBar from "./utils/BottomBar";
import ProtectedAccess from "./utils/Protected";

//20251215
// Direcciones de pages
import Home from "./pages/Home";
import Perfil from "./pages/Perfil";
import PerfilLogin from "./pages/PerfilLogin";
import PerfilStatus from "./pages/PerfilStatus";
import Actividades from "./pages/Actividades";
import Calendario from "./pages/Calendario";
import Ludoteca from "./pages/Ludoteca";
import Miembros from "./pages/Miembros";
import Logros from "./pages/Logros";

//20251215
// Muestra de la App
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen pb-14 bg-gradient-to-t from-black via-blue-950 to-indigo-950 text-white">
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/login" element={<PerfilLogin />} />

            {/* Perfil autenticado */}
            <Route
              path="/perfil/status"
              element={
                <ProtectedAccess>
                  <PerfilStatus />
                </ProtectedAccess>
              }
            />

            {/* Protegidas */}
            <Route
              path="/actividades"
              element={
                <ProtectedAccess>
                  <Actividades />
                </ProtectedAccess>
              }
            />

            <Route
              path="/actividades/:id"
              element={
                <ProtectedAccess>
                  <Actividades />
                </ProtectedAccess>
              }
            />


            <Route
              path="/calendario"
              element={
                <ProtectedAccess>
                  <Calendario />
                </ProtectedAccess>
              }
            />

            <Route
              path="/ludoteca"
              element={
                <ProtectedAccess>
                  <Ludoteca />
                </ProtectedAccess>
              }
            />

            <Route
              path="/miembros"
              element={
                <ProtectedAccess>
                  <Miembros />
                </ProtectedAccess>
              }
            />

            <Route
              path="/logros"
              element={
                <ProtectedAccess>
                  <Logros />
                </ProtectedAccess>
              }
            />
          </Routes>

          {/* Siempre visible */}
          <BottomBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
