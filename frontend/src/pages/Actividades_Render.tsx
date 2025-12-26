import React from "react";

/* =====================================================
   Tipos
===================================================== */

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
  created_by?: string;
};

/* =====================================================
   Constantes
===================================================== */

/**
 * Tipos disponibles de actividad.
 * Se usan solo para el selector del formulario.
 */
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

/* =====================================================
   Props
===================================================== */

type Props = {
  activities: Activity[];
  loading: boolean;
  isDetailView: boolean;

  // Permisos (frontend)
  canAdmin: boolean;
  canOrganize: boolean;

  currentUserId?: string;

  // Estado del formulario
  imageUrl: string | null;
  uploading: boolean;
  title: string;
  setTitle: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  participants: string;
  setParticipants: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;

  // Acciones
  onUploadImage: (file: File) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onReplaceImage: (id: number, file: File) => void;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
  onRemoveParticipant: (
    activityId: number,
    userId: string
  ) => void;

  // Utilidades
  apiUrl: string;
  formatDate: (iso?: string) => string | null;
  formatDateTime: (iso?: string) => string;
};

/* =====================================================
   Render
===================================================== */

export default function Actividades_Render({
  activities,
  loading,
  isDetailView,

  canAdmin,
  canOrganize,
  currentUserId,

  imageUrl,
  uploading,
  title,
  setTitle,
  type,
  setType,
  description,
  setDescription,
  participants,
  setParticipants,
  duration,
  setDuration,

  onUploadImage,
  onCreate,
  onDelete,
  onReplaceImage,
  onJoin,
  onLeave,
  onRemoveParticipant,

  apiUrl,
  formatDate,
  formatDateTime,
}: Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Actividades</h1>

      {/* =================================================
          CREAR ACTIVIDAD
          Visible solo para ADMIN / ORGANIZER
         ================================================= */}
      {!isDetailView && (canAdmin || canOrganize) && (
        <div className="bg-white rounded-xl p-4 text-gray-900 shadow space-y-4">
          <div className="flex gap-4">

            {/* Imagen */}
            <label className="w-40 h-56 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
              {imageUrl ? (
                <img
                  src={`${apiUrl}${imageUrl}`}
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
                  e.target.files &&
                  onUploadImage(e.target.files[0])
                }
              />
            </label>

            {/* Formulario */}
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
                placeholder="Título de la actividad"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="w-full border rounded px-2 py-1 resize-y"
                placeholder="Descripción"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

              <div className="flex gap-2">
                <input
                  className="w-1/2 border rounded px-2 py-1"
                  placeholder="👥 Jugadores (opcional)"
                  value={participants}
                  onChange={(e) =>
                    setParticipants(e.target.value)
                  }
                />
                <input
                  className="w-1/2 border rounded px-2 py-1"
                  placeholder="⏱ Duración h. (opcional)"
                  value={duration}
                  onChange={(e) =>
                    setDuration(e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onCreate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Añadir actividad
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          LISTADO DE ACTIVIDADES
         ================================================= */}
      {loading ? (
        <p className="text-center text-blue-200">
          Cargando…
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl p-4 text-gray-900 shadow flex gap-6 items-start"
            >
              {/* =====================
                  COLUMNA IZQUIERDA
                 ===================== */}
              <div className="w-32">
                {/* Imagen */}
                {a.image_url && (
                  <label
                    className={`block w-32 h-48 rounded-lg overflow-hidden ${
                      canAdmin || canOrganize
                        ? "cursor-pointer group"
                        : ""
                    }`}
                  >
                    <img
                      src={`${apiUrl}${a.image_url}`}
                      className="w-full h-full object-cover group-hover:opacity-80"
                    />
                    {(canAdmin ||
                      a.created_by === currentUserId) && (
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];
                          if (file)
                            onReplaceImage(a.id, file);
                          e.currentTarget.value = "";
                        }}
                      />
                    )}
                  </label>
                )}

                {/* Apuntarse / Salir */}
                <div className="mt-2">
                  {a.is_joined ? (
                    <button
                      onClick={() => onLeave(a.id)}
                      className="w-full text-sm py-1 rounded bg-red-100 text-red-700"
                    >
                      Salir
                    </button>
                  ) : (
                    <button
                      onClick={() => onJoin(a.id)}
                      className="w-full text-sm py-1 rounded bg-indigo-600 text-white"
                    >
                      Apuntarse
                    </button>
                  )}
                </div>

                {/* Participantes */}
                {a.participants_list &&
                  a.participants_list.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {a.participants_list.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                              {p.avatar_url ? (
                                <img
                                  src={`${apiUrl}${p.avatar_url}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                p.name
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(
                                  p.joined_at
                                )}
                              </p>
                            </div>
                          </div>

                          {(canAdmin ||
                            a.created_by ===
                              currentUserId) && (
                            <button
                              onClick={() =>
                                onRemoveParticipant(
                                  a.id,
                                  p.id
                                )
                              }
                              className="w-6 h-6 rounded-full bg-white text-red-600 hover:bg-red-100"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* =====================
                  INFO CENTRAL
                 ===================== */}
              <div className="flex-1 flex flex-col">
                <p className="text-indigo-600">
                  {a.type}
                </p>
                <p className="font-bold text-2xl">
                  {a.title}
                </p>
                <p className="text-sm whitespace-pre-line">
                  {a.description}
                </p>

                <div className="mt-auto pt-6 text-gray-500 flex gap-4 flex-wrap">
                  {a.participants && (
                    <span>👥 {a.participants}</span>
                  )}
                  {a.duration && (
                    <span>⏱ {a.duration}h</span>
                  )}
                  {(a.creator_name ||
                    a.created_at) && (
                    <span>
                      👤 {a.creator_name || "—"} ·{" "}
                      {formatDate(a.created_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* =====================
                  BORRAR ACTIVIDAD
                 ===================== */}
              {(canAdmin ||
                a.created_by === currentUserId) && (
                <button
                  onClick={() => onDelete(a.id)}
                  className="w-6 h-6 rounded-full bg-white text-red-600 hover:bg-red-100"
                  title="Eliminar actividad"
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
