import React from "react";

type Logro = {
  id: number;
  name: string;
  description: string;
};

type Props = {
  logros: Logro[];
  canAdmin: boolean;
  canOrganize: boolean;
  newName: string;
  newDescription: string;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  achievementImage: (name: string) => string;
};

export default function Logros_Render({
  logros,
  canAdmin,
  canOrganize,
  newName,
  newDescription,
  onChangeName,
  onChangeDescription,
  onCreate,
  onDelete,
  achievementImage,
}: Props) {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Logros</h1>

      {/* LISTADO */}
      <div className="grid grid-cols-2 gap-4">
        {[...logros]
          .sort((a, b) =>
            a.name.localeCompare(b.name, "es", {
              sensitivity: "base",
            })
          )
          .map((logro) => (
            <div
              key={logro.id}
              className="
                relative
                bg-white/90
                text-gray-900
                rounded-2xl
                shadow
                p-4
                flex flex-col
                gap-3
              "
            >
              {/* ❌ BORRAR (solo admin) */}
              {canAdmin && (
                <button
                  title="Eliminar logro"
                  onClick={() => onDelete(logro.id)}
                  className="
                    absolute top-3 right-3
                    w-5 h-5 rounded-full
                    bg-white text-red-600
                    text-lg font-bold
                    flex items-center justify-center
                    hover:bg-red-100 hover:text-red-800
                  "
                >
                  ×
                </button>
              )}

              {/* FILA SUPERIOR: AVATAR + TÍTULO */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-14 h-14 flex-shrink-0 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center">
                  <img
                    src={achievementImage(logro.name)}
                    alt={logro.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Título */}
                <p className="font-semibold">
                  {logro.name}
                  {canAdmin && (
                    <span className="ml-2 text-xs text-gray-400">
                      #{logro.id}
                    </span>
                  )}
                </p>
              </div>

              {/* DESCRIPCIÓN */}
              <p className="text-sm text-gray-600 leading-snug">
                {logro.description}
              </p>
            </div>
          ))}
      </div>

      {/* CREAR LOGRO */}
      {(canAdmin || canOrganize) && (
        <div className="mt-8 p-4 bg-white/90 rounded-xl shadow text-gray-900">
          <h2 className="font-semibold mb-2">
            Crear nuevo logro (La imagen es generada por Terto posteriormente)
          </h2>

          <input
            type="text"
            placeholder="ej: Ganador del Circo de Tertis"
            value={newName}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />

          <textarea
            placeholder="Descripción del logro"
            value={newDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />

          <button
            onClick={onCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Agregar logro
          </button>
        </div>
      )}
    </div>
  );
}
