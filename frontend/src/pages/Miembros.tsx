import Miembros_Render from "./Miembros_Render";
import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

/* =====================================================
   Tipos
===================================================== */

type Role = "USER" | "ORGANIZER" | "ADMIN";

type Achievement = {
  id: number;
  name: string;
  avatar_url?: string | null;
};

type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  roles: Role[];
  achievements: Achievement[];
};

/* =====================================================
   Configuración
===================================================== */

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Genera la URL pública del icono de un logro
 * (el backend genera el nombre del archivo a partir del slug)
 */
function achievementImage(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `${API_URL}/uploads/achievements/${slug}.png`;
}

/* =====================================================
   Componente principal (LÓGICA)
===================================================== */

export default function Miembros() {
  // Revisión de permisos
  const { token, user } = useAuth();
  //console.log("🧑 user desde useAuth:", user);
  //console.log("🎭 user?.role:", user?.role);
  const canAdmin = user?.role === "ADMIN";
  const canOrganize = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  /* =========================
     Estado
  ========================= */

  const [members, setMembers] = useState<Member[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Carga inicial
  ========================= */

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([membersRes, achievementsRes]) => {
        if (!membersRes.ok || !achievementsRes.ok) {
          throw new Error();
        }

        setMembers(await membersRes.json());
        setAllAchievements(await achievementsRes.json());
      })
      .catch(() =>
        setError("No se pudieron cargar los miembros")
      )
      .finally(() => setLoading(false));
  }, [token]);

  /* =========================
     Acciones
  ========================= */

  /**
   * Cambiar el rol de un usuario
   * (UI optimista; el backend valida permisos reales)
   */
  const changeRole = async (
    userId: string,
    role: Role
  ) => {
    await fetch(`${API_URL}/members/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    // Actualización optimista
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId ? { ...m, roles: [role] } : m
      )
    );
  };

  /**
   * Eliminar un usuario
   */
  const deleteUser = async (userId: string) => {
    if (
      !confirm("¿Seguro que quieres eliminar este usuario?")
    )
      return;

    const res = await fetch(`${API_URL}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      alert("Error eliminando usuario");
      return;
    }

    setMembers((prev) =>
      prev.filter((m) => m.id !== userId)
    );
  };

  /**
   * Asignar logro a un usuario
   */
  const addAchievement = async (
    userId: string,
    achievementId: number
  ) => {
    await fetch(
      `${API_URL}/members/${userId}/achievements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ achievementId }),
      }
    );

    const achievement = allAchievements.find(
      (a) => a.id === achievementId
    );
    if (!achievement) return;

    // Actualización optimista
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? {
              ...m,
              achievements: [
                ...m.achievements,
                achievement,
              ],
            }
          : m
      )
    );
  };

  /**
   * Quitar logro a un usuario
   */
  const removeAchievement = async (
    userId: string,
    achievementId: number
  ) => {
    await fetch(
      `${API_URL}/members/${userId}/achievements/${achievementId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Actualización optimista
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? {
              ...m,
              achievements: m.achievements.filter(
                (a) => a.id !== achievementId
              ),
            }
          : m
      )
    );
  };

  /* =========================
     Estados especiales
  ========================= */

  if (loading) {
    return (
      <div className="py-20 text-center">
        Cargando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-400">
        {error}
      </div>
    );
  }

  /* =========================
     Render
  ========================= */

  return (
    <Miembros_Render
      members={members}
      userId={user?.id}
      canAdmin={canAdmin}
      canOrganize={canOrganize}
      apiUrl={API_URL}
      allAchievements={allAchievements}
      onChangeRole={changeRole}
      onDeleteUser={deleteUser}
      onAddAchievement={addAchievement}
      onRemoveAchievement={removeAchievement}
      achievementImage={achievementImage}
    />
  );
}
