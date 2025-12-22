import PerfilStatus_Render from "./PerfilStatus_Render";
import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";

/* ===== Tipos ===== */
type ApiResponse = {
  message?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    avatar_url?: string;
    score?: number;
  };
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ===== Componente ===== */
export default function PerfilStatus() {
  const { token } = useAuth();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  /* ===== Formulario editable ===== */
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dni: "",
    password: "",
  });

  /* ===== Cargar perfil ===== */
  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el perfil");
        return res.json();
      })
      .then((json: ApiResponse) => {
        setData(json);

        if (json.user) {
          setForm({
            name: json.user.name || "",
            email: json.user.email || "",
            phone: json.user.phone || "",
            dni: json.user.dni || "",
            password: "",
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const user = data?.user;


  /* ===== Avatar ===== */
  useEffect(() => {
    setAvatarLoaded(false);
  }, [user?.avatar_url]);

  const uploadAvatar = async (file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();

      setData((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                avatar_url: json.avatar_url,
              },
            }
          : prev
      );
    } catch {
      alert("Error subiendo avatar");
    } finally {
      setUploading(false);
    }
  };

  /* ===== Guardar perfil ===== */
  const saveProfile = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Error guardando perfil");
      }

      // Reflejar cambios localmente
      setData((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                ...form,
              },
            }
          : prev
      );

      alert("Perfil actualizado");
    } catch (e: any) {
      alert(e?.message || "Error al guardar perfil");
    }
  };

  /* ===== Estados visuales ===== */
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-blue-200">
        Cargando perfil…
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

  if (!user) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        No se han recibido datos de usuario
      </div>
    );
  }

  /* ===== Render ===== */

  return (
    <PerfilStatus_Render
      user={user}
      form={form}
      setForm={setForm}
      onSave={saveProfile}
      avatarLoaded={avatarLoaded}
      setAvatarLoaded={setAvatarLoaded}
      uploading={uploading}
      uploadAvatar={uploadAvatar}
      apiUrl={API_URL}
    />
  );
}
