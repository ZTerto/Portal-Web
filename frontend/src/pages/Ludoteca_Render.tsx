/* =====================================================
   Tipos
===================================================== */

type Participant = {
  id: string;
  name: string;
  avatar_url?: string | null;
  joined_at: string;
};

type Ludoteca = {
  id: number;
  title: string;
  type: string;
  description: string;
  participants?: number;
  duration?: string | null;
  image_url?: string;
  created_by?: string;
  creator_name?: string;
  created_at?: string;
  participants_list?: Participant[];
  is_joined?: boolean;
};

/* =====================================================
   Props
===================================================== */

type Props = {
  ludotecas: Ludoteca[];
  loading: boolean;
  isDetailView: boolean;
  currentUserId?: string;

  /* Formulario */
  types: string[];
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
  imageUrl: string | null;
  uploading: boolean;

  /* Permisos (frontend) */
  canAdmin: boolean;
  canOrganize: boolean;

  /* Utilidades */
  apiUrl: string;
  formatDate: (iso?: string) => string | null;
  formatDateTime: (iso?: string) => string;

  /* Acciones */
  onUploadImage: (file: File) => void;
  onCreate: () => void;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
  onDelete: (id: number) => void;
  onReplaceImage: (id: number, file: File) => void;
};

/* =====================================================
   Componente de Render
===================================================== */

export default function Ludoteca_Render({
  ludotecas,
  loading,
  isDetailView,
  currentUserId,

  types,
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
  imageUrl,
  uploading,

  canAdmin,
  canOrganize,

  apiUrl,
  formatDate,
  formatDateTime,

  onUploadImage,
  onCreate,
  onJoin,
  onLeave,
  onDelete,
  onReplaceImage,
}: Props) {
  /* =========================
     Estado de carga
  ========================= */
  if (loading) {
    return (
      <p className="text-center py-20 text-blue-200">
        Cargando ludoteca…
      </p>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Ludoteca</h1>

      {/* =================================================
          CREAR LUDOTECA
          Visible solo si NO es vista detalle
         ================================================= */}
      {!isDetailView && (
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
                hidden
                accept="image/*"
                onChange={(e) =>
                  e.target.files &&
                  onUploadImage(e.target.files[0])
                }
              />
            </label>

            {/* Campos */}
            <div className="flex-1 space-y-2">
              <select
                className="w-full border rounded px-2 py-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {types.map((t) => (
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
                  placeholder="👥 Participantes (opcional)"
                  value={participants}
                  onChange={(e) =>
                    setParticipants(e.target.value)
                  }
                />
                <input
                  className="w-1/2 border rounded px-2 py-1"
                  placeholder="⏱ Duración (opcional)"
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
              Añadir a Ludoteca
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          LISTADO DE LUDOTECA
         ================================================= */}
      <div className="space-y-4">
        {ludotecas.map((l) => {
          const isOwner = l.created_by === currentUserId;

          return (
            <div
              key={l.id}
              className="bg-white rounded-xl p-4 text-gray-900 shadow flex gap-6"
            >
              {/* =====================
                  COLUMNA IZQUIERDA
                 ===================== */}
              <div className="w-32">
                {/* Imagen */}
                {l.image_url && (
                  <label
                    className={`block w-32 h-48 rounded-lg overflow-hidden ${
                      isOwner ? "cursor-pointer" : ""
                    }`}
                  >
                    <img
                      src={`${apiUrl}${l.image_url}`}
                      className="w-full h-full object-cover"
                      alt={l.title}
                    />

                    {isOwner && (
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const f =
                            e.target.files?.[0];
                          if (f)
                            onReplaceImage(l.id, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    )}
                  </label>
                )}

                {/* Interés */}
                <div className="mt-2">
                  {l.is_joined ? (
                    <button
                      onClick={() => onLeave(l.id)}
                      className="w-full text-sm py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Quitar interés
                    </button>
                  ) : (
                    <button
                      onClick={() => onJoin(l.id)}
                      className="w-full text-sm py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Me interesa
                    </button>
                  )}
                </div>

                {/* Participantes */}
                {Array.isArray(l.participants_list) &&
                  l.participants_list.length >
                    0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-gray-500 text-center">
                        Interesados:
                      </p>

                      {l.participants_list
                        .slice(0, 6)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                              {p.avatar_url ? (
                                <img
                                  src={`${apiUrl}${p.avatar_url}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                p.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ??
                                "?"
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatDateTime(
                                  p.joined_at
                                )}
                              </p>
                            </div>
                          </div>
                        ))}

                      {l.participants_list.length >
                        6 && (
                        <p className="text-[11px] text-gray-400 text-center">
                          +
                          {l.participants_list.length -
                            6}{" "}
                          más
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* =====================
                  COLUMNA DERECHA
                 ===================== */}
              <div className="flex-1">
                <p className="text-indigo-600">
                  {l.type}
                </p>
                <p className="font-bold text-2xl">
                  {l.title}
                </p>
                <p className="text-sm whitespace-pre-line">
                  {l.description}
                </p>

                <div className="mt-4 text-sm text-gray-500 flex gap-4 flex-wrap">
                  {typeof l.participants ===
                    "number" && (
                    <span>👥 {l.participants}</span>
                  )}
                  {l.duration && (
                    <span>⏱ {l.duration}</span>
                  )}
                  {(l.creator_name ||
                    l.created_at) && (
                    <span>
                      👤 {l.creator_name || "—"} ·{" "}
                      {formatDate(l.created_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* =====================
                  BORRAR
                 ===================== */}
              {(isOwner ||
                canAdmin ||
                canOrganize) && (
                <button
                  onClick={() => onDelete(l.id)}
                  title="Eliminar"
                  className="w-6 h-6 rounded-full bg-white text-red-600 hover:bg-red-100"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
