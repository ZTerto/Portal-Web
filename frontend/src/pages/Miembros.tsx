import Miembros_Render from "./Miembros_Render";
import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";


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

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// Función para obtener la URL de la imagen del logro
function achievementImage(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `${API_URL}/uploads/achievements/${slug}.png`;
}

export default function Miembros() {
  const { token, user, canAdmin, canOrganize } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .then(async ([mRes, aRes]) => {
        if (!mRes.ok || !aRes.ok) throw new Error();
        setMembers(await mRes.json());
        setAllAchievements(await aRes.json());
      })
      .catch(() => setError("No se pudieron cargar los miembros"))
      .finally(() => setLoading(false));
  }, [token]);

  const changeRole = async (userId: string, role: Role) => {
    await fetch(`${API_URL}/members/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId ? { ...m, roles: [role] } : m
      )
    );
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("¿Seguro que quieres eliminar este usuario?"))
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

    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? {
              ...m,
              achievements: [...m.achievements, achievement],
            }
          : m
      )
    );
  };

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

  if (loading)
    return <div className="py-20 text-center">Cargando…</div>;

  if (error)
    return (
      <div className="py-20 text-center text-red-400">
        {error}
      </div>
    );

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
