import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

type Participant = {
  id: string;
  name: string;
  avatar_url?: string | null;
  joined_at: string;
};

type Activity = {
  id: number;
  title: string;
  type: string;
  description: string;
  participants?: number;
  duration?: number;
  image_url?: string;
  creator_name?: string;
  created_at?: string;
  participants_list?: Participant[];
  is_joined?: boolean;
};

const TYPES = [
  "Rol de mesa",
  "Rol en vivo",
  "Juego de mesa",
  "Experimental",
  "Cine exterior",
  "Softcombat",
  "Barbacoa",
  "Otros",
];

const formatDate = (iso?: string) => {
  if (!iso) return null;

  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Actividades() {
  const { token, canAdmin, canOrganize } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FORM STATE
  ========================= */
  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState("");
  const [duration, setDuration] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /* =========================
     Cargar actividades
  ========================= */
  useEffect(() => {
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setActivities(data))
      .catch((err) =>
        console.error("Error cargando actividades:", err)
      )
      .finally(() => setLoading(false));
  }, [token]);

  /* =========================
     Subir imagen (crear actividad)
  ========================= */
  const uploadImage = async (file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title || "actividad");

    setUploading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/activities/upload-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      alert("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     Crear actividad
  ========================= */
  const createActivity = async () => {
    if (!title || !description || !token) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/activities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          type,
          description,
          participants: participants ? Number(participants) : null,
          duration: duration ? Number(duration) : null,
          image_url: imageUrl,
        }),
      }
    );

    if (!res.ok) {
      alert("Error creando actividad");
      return;
    }

    const newActivity = await res.json();
    setActivities((prev) => [newActivity, ...prev]);

    setTitle("");
    setDescription("");
    setParticipants("");
    setDuration("");
    setImageUrl(null);
  };

  /* =========================
     Borrar actividad
  ========================= */
  const deleteActivity = async (id: number) => {
    if (!token) return;

    if (!confirm("¿Seguro que quieres borrar esta actividad?")) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/activities/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      alert("Error borrando actividad");
      return;
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  /* =========================
     Reemplazar imagen de actividad
  ========================= */
  const replaceActivityImage = async (id: number, file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/activities/${id}/image`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-File-Name": file.name,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Error reemplazando imagen");
      return;
    }

    const updated = await res.json();
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
  };

  /* =========================
     Apuntarse a actividad
  ========================= */
  const joinActivity = async (id: number) => {
    if (!token) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/activities/${id}/join`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const msg = await res.text();
      console.error("JOIN ERROR:", msg);
      alert("Error al apuntarse");
      return;
    }

    const updated = await res.json();

    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...updated,
              participants_list: updated.participants_list ?? [],
              is_joined: !!updated.is_joined,
            }
          : a
      )
    );
  };

  /* =========================
     Salir de actividad
  ========================= */
  const leaveActivity = async (id: number) => {
    if (!token) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/activities/${id}/join`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const msg = await res.text();
      console.error("LEAVE ERROR:", msg);
      alert("Error al salir");
      return;
    }

    const updated = await res.json();

    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...updated,
              participants_list: updated.participants_list ?? [],
              is_joined: !!updated.is_joined,
            }
          : a
      )
    );
  };

/* =========================
   Quitar usuario de actividad (ADMIN / ORGANIZER)
========================= */
const removeParticipant = async (
  activityId: number,
  userId: string
) => {
  if (!token) return;

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/activities/${activityId}/participants/${userId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    alert("Error retirando usuario");
    return;
  }

  const updated = await res.json();

  setActivities((prev) =>
    prev.map((a) => (a.id === activityId ? updated : a))
  );
};


/* =========================
   Render
========================= */
return (
  <div className="p-4 max-w-5xl mx-auto space-y-8">
    <h1 className="text-2xl font-bold">Actividades</h1>

    {(canAdmin || canOrganize) && (
      <div className="bg-white rounded-xl p-4 text-gray-900 shadow space-y-4">
        <div className="flex gap-4">
          <label className="w-40 h-56 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
            {imageUrl ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm text-gray-500">
                {uploading ? "Subiendo…" : "Imagen"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                e.target.files && uploadImage(e.target.files[0])
              }
            />
          </label>

          <div className="flex-1 space-y-2">
            <select
              className="w-full border rounded px-2 py-1"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              className="w-full border rounded px-2 py-1"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full border rounded px-2 py-1 h-64"
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                className="w-1/2 border rounded px-2 py-1"
                placeholder="Número participantes"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
              <input
                className="w-1/2 border rounded px-2 py-1"
                placeholder="Horas aproximadas"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={createActivity}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Añadir actividad
          </button>
        </div>
      </div>
    )}

    {loading ? (
      <p className="text-center text-blue-200">Cargando…</p>
    ) : (
      <div className="space-y-4">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex gap-4 bg-white/90 text-gray-900 rounded-xl p-4 shadow"
          >
            {/* IMAGEN + BOTÓN */}
            <div className="w-32">
              {a.image_url && (
                <label
                  className={`block w-32 h-48 rounded-lg overflow-hidden ${
                    canAdmin || canOrganize ? "cursor-pointer group" : ""
                  }`}
                >
                  <img
                    src={`${import.meta.env.VITE_API_URL}${a.image_url}`}
                    className="w-full h-full object-cover group-hover:opacity-80 transition"
                  />

                  {(canAdmin || canOrganize) && (
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          replaceActivityImage(a.id, file);
                        e.currentTarget.value = "";
                      }}
                    />
                  )}
                </label>
              )}

              <div className="mt-2">
                {a.is_joined ? (
                  <button
                    onClick={() => leaveActivity(a.id)}
                    className="w-full text-sm py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Salir
                  </button>
                ) : (
                  <button
                    onClick={() => joinActivity(a.id)}
                    className="w-full text-sm py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Apuntarse
                  </button>
                )}
              </div>

              {/* PARTICIPANTES */}
              {Array.isArray(a.participants_list) &&
                a.participants_list.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {a.participants_list.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex gap-3 items-center">
                          <div
                            title={p.name}
                            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden"
                          >
                            {p.avatar_url ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}${p.avatar_url}`}
                                className="w-full h-full object-cover"
                                alt={p.name}
                              />
                            ) : (
                              p.name?.charAt(0)?.toUpperCase() ?? "?"
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              {p.name ?? "Usuario"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(p.joined_at)}
                            </p>
                          </div>
                        </div>

                        {(canAdmin || canOrganize) && (
                          <button
                            onClick={() => removeParticipant(a.id, p.id)}
                            title="Quitar de la actividad"
                              className="
                              w-4 h-4
                              flex items-center justify-center
                              rounded-full
                              bg-white
                              text-red-600
                              hover:bg-red-500
                              hover:text-red-700
                              transition-colors
                            "
                          >
                            ×
                          </button>
                        )}

                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* INFO */}
            <div className="flex-1 flex flex-col">
              <p className="text-base text-indigo-600">{a.type}</p>
              <p className="font-semibold text-2xl">{a.title}</p>
              <p className="text-base text-gray-700">{a.description}</p>

              <div className="mt-auto pt-6 text-base text-gray-500 flex gap-4 flex-wrap">
                {a.participants && <span>👥 {a.participants}</span>}
                {a.duration && <span>⏱ {a.duration}h</span>}
                {(a.creator_name || a.created_at) && (
                  <span>
                    👤 {a.creator_name || "—"} ·{" "}
                    {formatDate(a.created_at)}
                  </span>
                )}
              </div>
            </div>

            {canAdmin && (
              <button
                onClick={() => deleteActivity(a.id)}
                              className="
                              w-6 h-6
                              flex items-center justify-center
                              rounded-full
                              bg-white
                              text-red-600
                              hover:bg-red-500
                              hover:text-red-700
                              transition-colors
                            "
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
}