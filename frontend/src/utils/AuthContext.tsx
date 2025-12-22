import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* =========================
   Tipos
========================= */

export type Role = "USER" | "ORGANIZER" | "ADMIN";

type User = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  roles: Role[];
};

type RegisterData = {
  name: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (name: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  canAdmin: boolean;
  canOrganize: boolean;
};

/* =========================
   Contexto
========================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* =========================
   Provider
========================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /* =========================
     Recuperar sesión
  ========================= */

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) return;

    setToken(storedToken);

    fetch("http://localhost:3000/me", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Sesión inválida");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch(() => {
        logout();
      });
  }, []);

  /* =========================
     LOGIN
  ========================= */

  const login = async (name: string, password: string) => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (!res.ok) {
      throw new Error("Credenciales incorrectas");
    }

    const data = await res.json();

    setToken(data.token);
    localStorage.setItem("token", data.token);

    // 🔁 Cargar perfil completo (con roles)
    const meRes = await fetch("http://localhost:3000/me", {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });

    if (!meRes.ok) {
      throw new Error("No se pudo recuperar el perfil");
    }

    const meData = await meRes.json();

    console.log("🔍 /me response:", meData);
    setUser(meData.user);
    localStorage.setItem("user", JSON.stringify(meData.user));
  };

  /* =========================
     REGISTER
  ========================= */

  const register = async (data: RegisterData) => {
    const res = await fetch("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al registrarse");
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  /* =========================
     Permisos derivados
  ========================= */

  const roles = user?.roles ?? [];

  const canAdmin = roles.includes("ADMIN");
  const canOrganize = roles.includes("ADMIN") || roles.includes("ORGANIZER");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        canAdmin,
        canOrganize,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   Hook
========================= */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
