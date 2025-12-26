import Logros_Render from "./Logros_Render";
import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

type Logro = {
  id: number;
  name: string;
  description: string;
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Logros() {
  // Revisión de permisos
  const { token, user } = useAuth();
  //console.log("🧑 user desde useAuth:", user);
  //console.log("🎭 user?.role:", user?.role);
  const canAdmin = user?.role === "ADMIN";
  const canOrganize = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  const [logros, setLogros] = useState<Logro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/achievements`, {
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

  const createAchievement = async () => {
    if (!newName.trim() || !newDescription.trim()) return;

    const res = await fetch(`${API_URL}/achievements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDescription.trim(),
      }),
    });

    if (!res.ok) {
      alert("No se pudo crear el logro");
      return;
    }

    const created = await res.json();
    setLogros((prev) => [...prev, created]);
    setNewName("");
    setNewDescription("");
  };

  const deleteAchievement = async (id: number) => {
    if (!confirm("¿Eliminar este logro?")) return;

    const res = await fetch(`${API_URL}/achievements/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      alert("No se pudo borrar el logro");
      return;
    }

    setLogros((prev) => prev.filter((l) => l.id !== id));
  };

  function achievementImage(name: string) {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

    return `${API_URL}/uploads/achievements/${slug}.png`;
  }

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
    <Logros_Render
      logros={logros}
      canAdmin={canAdmin}
      canOrganize={canOrganize}
      newName={newName}
      newDescription={newDescription}
      onChangeName={setNewName}
      onChangeDescription={setNewDescription}
      onCreate={createAchievement}
      onDelete={deleteAchievement}
      achievementImage={achievementImage}
    />
  );
}
