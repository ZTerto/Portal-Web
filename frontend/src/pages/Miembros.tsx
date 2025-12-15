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

export default function Miembros() {
  const { token, user, canAdmin, canOrganize } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     Cargar datos
  ========================= */
  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(import.meta.env.VITE_API_URL + "/members", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(import.meta.env.VITE_API_URL + "/achievements", {
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

  /* =========================
     Acciones
  ========================= */

  const changeRole = async (userId: string, role: Role) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/members/${userId}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      }
    );

    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId ? { ...m, roles: [role] } : m
      )
    );
  };

  const deleteUser = async (userId: string) => {
    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar este usuario?"
    );
    if (!confirmDelete) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/members/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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
      `${import.meta.env.VITE_API_URL}/members/${userId}/achievements`,
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
      `${import.meta.env.VITE_API_URL}/members/${userId}/achievements/${achievementId}`,
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
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Miembros</h1>

      {members.map((member) => {
        const role = member.roles[0];
        const isSelf = user?.id === member.id;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white/90 text-gray-900 shadow"
          >
            {/* IZQUIERDA */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${member.avatar_url}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>

                {canAdmin && !isSelf && (
                  <div className="flex gap-2 text-xl">
                    {role === "USER" && (
                      <button
                        title="Subir a organizer"
                        onClick={() =>
                          changeRole(member.id, "ORGANIZER")
                        }
                      >
                        ⬆️
                      </button>
                    )}

                    {role === "ORGANIZER" && (
                      <button
                        title="Bajar a user"
                        onClick={() =>
                          changeRole(member.id, "USER")
                        }
                      >
                        ⬇️
                      </button>
                    )}

                    <button
                      title="Eliminar usuario"
                      onClick={() => deleteUser(member.id)}
                              className="
                              w-6 h-6
                              flex items-center justify-center
                              rounded-full
                              bg-white
                              text-red-600
                              hover:text-red-800
                              hover:bg-red-100
                              transition-colors
                            "
                    >
                      x
                    </button>
                  </div>
                )}
              </div>

              {/* INFO */}
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-gray-500">
                  {member.email}
                </p>
                <span className="text-xs text-indigo-700 font-medium">
                  {role}
                </span>
              </div>
            </div>

            {/* DERECHA */}
            <div className="flex items-center gap-3">
              <div
                className="grid grid-cols-5 gap-2"
                style={{ direction: "rtl" }}
              >
                {member.achievements.slice(0, 10).map((ach) => (
                  <div
                    key={ach.id}
                    className="relative w-9 h-9"
                  >
                    <img
                      src={ach.avatar_url
                        ? `${import.meta.env.VITE_API_URL}${ach.avatar_url}`
                        : ""
                      }
                      alt={ach.name}
                      className="w-full h-full rounded-full object-cover"
                    />

                    {(canAdmin || canOrganize) && (
                      <button
                        title="Quitar logro"
                        onClick={() =>
                          removeAchievement(
                            member.id,
                            ach.id
                          )
                        }
                        className="
                          absolute -top-1 -right-1
                          w-4 h-4
                          flex items-center justify-center
                          text-red-600 text-xs font-bold leading-none
                          bg-white rounded-full
                          shadow
                          hover:bg-red-100
                        "
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(canAdmin || canOrganize) && (
                <select
                  className="border rounded px-1 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addAchievement(
                        member.id,
                        Number(e.target.value)
                      );
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    +
                  </option>

                  {allAchievements
                    .filter(
                      (a) =>
                        !member.achievements.some(
                          (ma) => ma.id === a.id
                        )
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
