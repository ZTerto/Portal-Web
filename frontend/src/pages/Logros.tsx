import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

type Logro = {
  id: number;
  name: string;
  description: string;
};

function achievementImage(name: string) {
  const file = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_");

  return `${import.meta.env.VITE_API_URL}/uploads/achievements/${file}.png`;
}

export default function Logros() {
  const { token, canAdmin, canOrganize } = useAuth();

  const [logros, setLogros] = useState<Logro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  /* =========================
     Cargar logros
  ========================= */
  useEffect(() => {
    if (!token) return;

    fetch(import.meta.env.VITE_API_URL + "/achievements", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setLogros)
      .catch(() =>
        setError("No se pudieron cargar los logros")
      )
      .finally(() => setLoading(false));
  }, [token]);

/* =========================
   Crear logro
========================= */
const createAchievement = async () => {
  if (!newName.trim() || !newDescription.trim()) return;

  const res = await fetch(
    import.meta.env.VITE_API_URL + "/achievements",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName.trim(),          // 👈 título libre
        description: newDescription.trim(),
      }),
    }
  );

  if (!res.ok) {
    alert("No se pudo crear el logro");
    return;
  }

  const created = await res.json();
  setLogros((prev) => [...prev, created]);
  setNewName("");
  setNewDescription("");
};


  /* =========================
     Borrar logro (ADMIN)
  ========================= */
  const deleteAchievement = async (id: number) => {
    if (!confirm("¿Eliminar este logro?")) return;

    const res = await fetch(
      import.meta.env.VITE_API_URL + `/achievements/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      alert("No se pudo borrar el logro");
      return;
    }


    // Actualizar lista
    setLogros((prev) => prev.filter((l) => l.id !== id));
  };

  function achievementImage(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")                 // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `${import.meta.env.VITE_API_URL}/uploads/achievements/${slug}.png`;
}


  /* =========================
     Render
  ========================= */

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-blue-200">
        Cargando logros…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Logros</h1>

      {/* LISTADO */}
      <div className="grid grid-cols-2 gap-4">
        {logros.map((logro) => (
          <div
            key={logro.id}
            className="relative bg-white/90 text-gray-900 rounded-2xl shadow p-4 flex gap-4"
          >
            {/* ❌ BORRAR (solo admin) */}
            {canAdmin && (
              <button
                title="Eliminar logro"
                onClick={() => deleteAchievement(logro.id)}
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

            {/* Avatar */}
            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center relative">
  <img
    src={achievementImage(logro.name)}
    alt={logro.name}
    className="w-full h-full object-contain"
    onError={(e) => {
      e.currentTarget.style.display = "none";
    }}
  />
  <span className="absolute text-white font-bold pointer-events-none opacity-0">
    {logro.name.charAt(0).toUpperCase()}
  </span>
</div>


            {/* Texto */}
            <div>
              <p className="font-semibold">
                {logro.name}
                {canAdmin && (
                  <span className="ml-2 text-xs text-gray-400">
                    #{logro.id}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                {logro.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CREAR LOGRO */}
      {(canAdmin || canOrganize) && (
        <div className="mt-8 p-4 bg-white/90 rounded-xl shadow text-gray-900">
          <h2 className="font-semibold mb-2">
            Crear nuevo logro (una sola palabra, usa _)
          </h2>

          <input
            type="text"
            placeholder="ej: Pokemon_drinking_game"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />

          <textarea
            placeholder="Descripción del logro"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />

          <button
            onClick={createAchievement}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
