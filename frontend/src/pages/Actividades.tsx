import Actividades_Render from "./Actividades_Render";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

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
   Configuración
===================================================== */

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/* =====================================================
   Utilidades de formato
===================================================== */

const formatDate = (iso?: string) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-ES");
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-ES");
};


/* =====================================================
   Componente principal (LÓGICA)
===================================================== */

export default function Actividades() {
  // Revisión de permisos
  const { token, user } = useAuth();
  //console.log("🧑 user desde useAuth:", user);
  //console.log("🎭 user?.role:", user?.role);
  const canAdmin = user?.role === "ADMIN";
  const canOrganize = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  // Si hay :id en la ruta → vista detalle
  const { id } = useParams<{ id?: string }>();
  const isDetailView = Boolean(id);

  /* =========================
     Estado
  ========================= */
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de creación
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Rol de mesa");
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

    const url = id
      ? `${API_URL}/activities/${id}`
      : `${API_URL}/activities`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) =>
        setActivities(id ? [data] : data)
      )
      .finally(() => setLoading(false));
  }, [token, id]);

  /* =========================
     Subida de imagen (crear)
  ========================= */

  const uploadImage = async (file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title || "actividad");

    setUploading(true);

    const res = await fetch(
      `${API_URL}/activities/upload-image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    const data = await res.json();
    setImageUrl(data.url);
    setUploading(false);
  };

  /* =========================
     Crear actividad
     (ADMIN / ORGANIZER)
  ========================= */

  const createActivity = async () => {
    if (!token || !title || !description) return;

    const res = await fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        type,
        description,
        participants: participants
          ? Number(participants)
          : null,
        duration: duration ? Number(duration) : null,
        image_url: imageUrl,
      }),
    });

    const created = await res.json();

    // Añadir al listado
    setActivities((prev) => [created, ...prev]);

    // Reset formulario
    setTitle("");
    setDescription("");
    setParticipants("");
    setDuration("");
    setImageUrl(null);
  };

  /* =========================
     Eliminar actividad
     (ADMIN)
  ========================= */

  const deleteActivity = async (id: number) => {
    if (!token || !confirm("¿Eliminar actividad?")) return;

    await fetch(`${API_URL}/activities/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setActivities((prev) =>
      prev.filter((a) => a.id !== id)
    );
  };

  /* =========================
     Reemplazar imagen
  ========================= */

  const replaceActivityImage = async (
    id: number,
    file: File
  ) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `${API_URL}/activities/${id}/image`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-File-Name": file.name,
        },
        body: formData,
      }
    );

    const updated = await res.json();

    setActivities((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
  };

  /* =========================
     Participación
  ========================= */

  const joinActivity = async (id: number) => {
    if (!token) return;

    const res = await fetch(
      `${API_URL}/activities/${id}/join`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const updated = await res.json();
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
  };

  const leaveActivity = async (id: number) => {
    if (!token) return;

    const res = await fetch(
      `${API_URL}/activities/${id}/join`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const updated = await res.json();
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
  };

  const removeParticipant = async (
    activityId: number,
    userId: string
  ) => {
    if (!token) return;

    const res = await fetch(
      `${API_URL}/activities/${activityId}/participants/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const updated = await res.json();
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId ? updated : a
      )
    );
  };

  /* =========================
     Render
  ========================= */

return (
  <Actividades_Render
    activities={activities}
    loading={loading}
    isDetailView={isDetailView}

    canAdmin={canAdmin}
    canOrganize={canOrganize}

    imageUrl={imageUrl}
    uploading={uploading}
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

    onUploadImage={uploadImage}
    onCreate={createActivity}
    onDelete={deleteActivity}
    onReplaceImage={replaceActivityImage}
    onJoin={joinActivity}
    onLeave={leaveActivity}
    onRemoveParticipant={removeParticipant}

    apiUrl={API_URL}
    formatDate={formatDate}
    formatDateTime={formatDateTime}
    currentUserId={user?.id}
  />
);

}
