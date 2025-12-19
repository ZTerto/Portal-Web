import Ludoteca_Render from "./Ludoteca_Render";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

/* ===== Tipos ===== */

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

/* ===== Constantes ===== */

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const TYPES = [
  "Juego de mesa",
  "Juego de cartas",
  "Wargame",
  "Experimental",
  "Otros",
];

/* ===== Utils ===== */

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("es-ES") : null;

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("es-ES") : "";

/* ===== Componente ===== */

export default function Ludoteca() {
  const { token, user, canAdmin, canOrganize } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const isDetailView = Boolean(id);

  const [ludotecas, setLudotecas] = useState<Ludoteca[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===== Form crear ===== */

  const [title, setTitle] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState("");
  const [duration, setDuration] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ===== Cargar ludoteca ===== */

  useEffect(() => {
    if (!token) return;

    const url = id
      ? `${API_URL}/ludoteca/${id}`
      : `${API_URL}/ludoteca`;

    setLoading(true);

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Error cargando ludoteca");
        return data;
      })
      .then((data) => setLudotecas(id ? [data] : data))
      .catch((e) => {
        console.error("LUDOTECA LOAD ERROR:", e);
        setLudotecas([]);
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  /* ===== Acciones ===== */

  const uploadImage = async (file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title || "ludoteca");

    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/ludoteca/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      setImageUrl(data.url);
    } catch (e) {
      console.error(e);
      alert("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const createLudoteca = async () => {
    if (!token || !title.trim() || !description.trim()) return;

    const res = await fetch(`${API_URL}/ludoteca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        type,
        description: description.trim(),
        participants: participants ? Number(participants) : null,
        duration: duration || null,
        image_url: imageUrl,
      }),
    });

    const created = await res.json();
    if (!res.ok) {
      alert(created?.error || "Error creando ludoteca");
      return;
    }

    setLudotecas((p) => [created, ...p]);

    setTitle("");
    setType(TYPES[0]);
    setDescription("");
    setParticipants("");
    setDuration("");
    setImageUrl(null);
  };

  const join = async (id: number) => {
    if (!token) return;

    const res = await fetch(`${API_URL}/ludoteca/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const updated = await res.json();
    if (!res.ok) return alert(updated?.error);

    setLudotecas((p) => p.map((l) => (l.id === id ? updated : l)));
  };

  const leave = async (id: number) => {
    if (!token) return;

    const res = await fetch(`${API_URL}/ludoteca/${id}/join`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const updated = await res.json();
    if (!res.ok) return alert(updated?.error);

    setLudotecas((p) => p.map((l) => (l.id === id ? updated : l)));
  };

  const remove = async (id: number) => {
    if (!token || !confirm("¿Eliminar de la ludoteca?")) return;

    const res = await fetch(`${API_URL}/ludoteca/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "No se pudo borrar");
      return;
    }

    setLudotecas((p) => p.filter((l) => l.id !== id));
  };

  const replaceImage = async (id: number, file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/ludoteca/${id}/image`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const updated = await res.json();
    if (!res.ok) return alert(updated?.error);

    setLudotecas((p) => p.map((l) => (l.id === id ? updated : l)));
  };

  /* ===== Render ===== */

  return (
    <Ludoteca_Render
      ludotecas={ludotecas}
      loading={loading}
      isDetailView={isDetailView}
      currentUserId={user?.id}
      apiUrl={API_URL}
      formatDate={formatDate}
      formatDateTime={formatDateTime}
      types={TYPES}
      title={title}
      setTitle={setTitle}
      type={type}
      setType={setType}
      description={description}
      setDescription={setDescription}
      participants={participants}
      setParticipants={setParticipants}
      duration={duration}
      setDuration={setDuration}
      imageUrl={imageUrl}
      uploading={uploading}
      onUploadImage={uploadImage}
      onCreate={createLudoteca}
      onJoin={join}
      onLeave={leave}
      onDelete={remove}
      onReplaceImage={replaceImage}
      canAdmin={canAdmin}
      canOrganize={canOrganize}
    />
  );
}
