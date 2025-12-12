import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext";

import BottomBar from "./utils/BottomBar";
import ProtectedAccess from "./utils/Protected";

import Home from "./pages/Home";
import Perfil from "./pages/Perfil";
import PerfilLogin from "./pages/PerfilLogin";
import Actividades from "./pages/Actividades";
import Calendario from "./pages/Calendario";
import Ludoteca from "./pages/Ludoteca";
import Miembros from "./pages/Miembros";

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
          </Routes>

          {/* Siempre visible */}
          <BottomBar />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
