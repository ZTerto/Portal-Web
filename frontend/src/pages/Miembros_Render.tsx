import React from "react";

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

type Props = {
  members: Member[];
  userId?: string;
  canAdmin: boolean;
  canOrganize: boolean;
  apiUrl: string;
  allAchievements: Achievement[];
  onChangeRole: (userId: string, role: Role) => void;
  onDeleteUser: (userId: string) => void;
  onAddAchievement: (userId: string, achievementId: number) => void;
  onRemoveAchievement: (userId: string, achievementId: number) => void;
  achievementImage: (name: string) => string;
};

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
      <h1 className="text-2xl font-bold mb-4">Miembros</h1>

      {members.map((member) => {
        const role = member.roles[0];
        const isSelf = userId === member.id;

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
                      src={`${apiUrl}${member.avatar_url}`}
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
                      onClick={() => onDeleteUser(member.id)}
                      className="w-6 h-6 rounded-full bg-white text-red-600 items-center justify-center hover:bg-red-100"
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
            <div className="flex items-center gap-3 w-[260px] shrink-0 justify-end">
              <div
                className="grid grid-cols-5 gap-2 max-w-[200px]"
                style={{ direction: "rtl" }}
              >
                {member.achievements.slice(0, 10).map((ach) => (
                  <div
                    key={ach.id}
                    className="relative w-9 h-9"
                  >
                    <img
                      src={achievementImage(ach.name)}
                      alt={ach.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />

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
                          absolute -top-1 -right-1
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
              </div>

              {(canAdmin || canOrganize) && (
                <select
                  className="border rounded px-1 text-sm w-10 shrink-0 text-center"
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
