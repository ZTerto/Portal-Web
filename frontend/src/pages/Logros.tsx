import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

type Logro = {
  id: number;
  name: string;
  description: string;
  avatar_url?: string | null;
};

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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al cargar logros");
        }
        return res.json();
      })
      .then((data) => {
        setLogros(data);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los logros");
      })
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
          name: newName,
          description: newDescription,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      alert("No se pudo borrar el logro");
      return;
    }

    setLogros((prev) => prev.filter((l) => l.id !== id));
  };

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
                  absolute top-2 right-2
                  text-red-600 text-lg font-bold
                  hover:text-red-800
                "
              >
                ×
              </button>
            )}

            {/* Avatar */}
            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-indigo-600 overflow-hidden flex items-center justify-center">
                {logro.avatar_url ? (
                    <img
                        src={logro.avatar_url}
                        alt={logro.name}
                        className="w-full h-full object-contain"
                    />
                    ) : (
                    <span className="text-white font-bold">
                        {logro.name.charAt(0).toUpperCase()}
                    </span>
                     )}
            </div>

            {/* Texto */}
            <div>
              <p className="font-semibold">{logro.name}</p>
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
          <h2 className="font-semibold mb-2">Crear nuevo logro (El título debe ser una sola palabra)</h2>

          <input
            type="text"
            placeholder="Título del logro"
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
