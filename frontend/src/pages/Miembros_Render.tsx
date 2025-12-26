import React from "react";

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
  phone?: string;
  avatar_url?: string | null;
  roles: Role[];
  achievements: Achievement[];
};

/* =====================================================
   Props
===================================================== */

type Props = {
  members: Member[];
  userId?: string;

  /* Permisos (frontend) */
  canAdmin: boolean;
  canOrganize: boolean;

  /* Config */
  apiUrl: string;
  allAchievements: Achievement[];

  /* Acciones */
  onChangeRole: (userId: string, role: Role) => void;
  onDeleteUser: (userId: string) => void;
  onAddAchievement: (userId: string, achievementId: number) => void;
  onRemoveAchievement: (
    userId: string,
    achievementId: number
  ) => void;

  /* Utils */
  achievementImage: (name: string) => string;
};

/* =====================================================
   Componente de Render
===================================================== */

export default function Miembros_Render({
  members,
  userId,
  canAdmin,
  canOrganize,
  apiUrl,
  allAchievements,
  onChangeRole,
  onDeleteUser,
  onAddAchievement,
  onRemoveAchievement,
  achievementImage,
}: Props) {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">
        Miembros
      </h1>

      {members.map((member) => {
        const role = member.roles[0];
        const isSelf = userId === member.id;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white/90 text-gray-900 shadow"
          >
            {/* =====================
                IZQUIERDA
               ===================== */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar + acciones */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={`${apiUrl}${member.avatar_url}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Controles admin */}
                {canAdmin && !isSelf && (
                  <div className="flex gap-2 text-lg">
                    {role === "USER" && (
                      <button
                        title="Subir a organizer"
                        onClick={() =>
                          onChangeRole(member.id, "ORGANIZER")
                        }
                      >
                        ⬆️
                      </button>
                    )}

                    {role === "ORGANIZER" && (
                      <button
                        title="Bajar a user"
                        onClick={() =>
                          onChangeRole(member.id, "USER")
                        }
                      >
                        ⬇️
                      </button>
                    )}

                    <button
                      title="Eliminar usuario"
                      onClick={() =>
                        onDeleteUser(member.id)
                      }
                      className="w-6 h-6 rounded-full bg-white text-red-600 hover:bg-red-100 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Información básica */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xl leading-tight">
                  {member.name}
                </p>

                <p className="
                    text-sm
                    text-gray-600
                    break-words
                    leading-snug
                    text-left
                  ">
                  {member.email}
                </p>

                {member.phone && (
                  <p className="text-sm text-gray-600">
                    {member.phone}
                  </p>
                )}

                <span className="text-xs text-indigo-700 font-medium">
                  {role}
                </span>
              </div>
            </div>

            {/* =====================
                DERECHA
               ===================== */}
            <div className="flex items-center justify-end w-[210px] shrink-0">
              {/* LOGROS + AÑADIR */}
              <div
                className="
                  grid grid-cols-4 gap-2
                  w-[160px]
                  justify-items-end
                "
              >
                {member.achievements.slice(0, 15).map((ach) => (
                  <div
                    key={ach.id}
                    className="
                      relative
                      w-10 h-10
                      rounded-full
                      overflow-hidden
                      flex-shrink-0
                    "
                  >
                    <img
                      src={achievementImage(ach.name)}
                      alt={ach.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (
                          e.currentTarget as HTMLImageElement
                        ).style.display = "none";
                      }}
                    />

                    {/* Quitar logro */}
                    {(canAdmin || canOrganize) && (
                      <button
                        title="Quitar logro"
                        onClick={() =>
                          onRemoveAchievement(
                            member.id,
                            ach.id
                          )
                        }
                        className="
                          absolute top-0 right-0
                          w-4 h-4
                          flex items-center justify-center
                          text-red-600 text-xs font-bold
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

                {/* BOTÓN + (como logro) */}
                {(canAdmin || canOrganize) && (
                  <div className="w-8 h-8 flex-shrink-0">
                    <select
                      title="Añadir logro"
                      className="
                        w-full h-full
                        rounded-full
                        border
                        text-sm
                        text-center
                        font-bold
                        cursor-pointer
                        appearance-none
                        bg-white
                        hover:bg-gray-100
                      "
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onAddAchievement(
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
                          <option
                            key={a.id}
                            value={a.id}
                          >
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
