import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/* =========================
   Tipos
========================= */

type User = {
  id: string;
  name: string;
  email: string;
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

  /* 🔁 Recuperar sesión al recargar */
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  /* 🔐 LOGIN (name + password) */
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
    setUser(data.user);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  /* 📝 REGISTER */
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

  /* 🚪 LOGOUT */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
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
