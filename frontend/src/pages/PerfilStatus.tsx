import PerfilStatus_Render from "./PerfilStatus_Render";
import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";


/* =====================================================
   Tipos
===================================================== */

type ApiResponse = {
  message?: string;
  user?: {
    /* identidad / permisos (JWT) */
    id: string;
    role?: string;

    /* perfil */
    name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    avatar_url?: string;
    score?: number;

    /* estados de participación */
    attendance?: AttendanceStatus;
    payment?: PaymentStatus;
    transport?: TransportStatus;
    food?: FoodStatus;
  };
};


/* =========================
   Estados de participación
========================= */

export type AttendanceStatus = 0 | 1;
export type PaymentStatus = 0 | 1;
export type TransportStatus = 0 | 1 | 2;
export type FoodStatus = 0 | 1 | 2;



/* =====================================================
   Configuración
===================================================== */

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/* =====================================================
   Componente principal (LÓGICA)
===================================================== */

export default function PerfilStatus() {
  const { token } = useAuth();

  /* =========================
     Estado general
  ========================= */

  const [data, setData] = useState<ApiResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );


  /* =========================
     Avatar
  ========================= */

  const [uploading, setUploading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] =
    useState(false);


  /* =========================
     Actualizar estados
  ========================= */

  const toggleAttendance = () => {
    if (attendance === 0) {
      setAttendance(1);
    } else {
      setAttendance(0);
    }
  };

  const togglePayment = () => {
    if (payment === 0) {
      setPayment(1);
    } else {
      setPayment(0);
    }
  };

  const cycleTransport = () => {
    if (transport === 0) {
      setTransport(1);
    } else if (transport === 1) {
      setTransport(2);
    } else {
      setTransport(0);
    }
  };

  const cycleFood = () => {
    if (food === 0) {
      setFood(1);
    } else if (food === 1) {
      setFood(2);
    } else {
      setFood(0);
    }
  };


  /* =========================
     Formulario editable
  ========================= */

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dni: "",
    password: "",
  });


  /* =========================
     Cargar perfil (/me)
  ========================= */

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            "Error al cargar el perfil"
          );
        return res.json();
      })
      .then((json: ApiResponse) => {
        setData(json);

        if (json.user) {

          //Inicializar formulario
          setForm({
            name: json.user.name || "",
            email: json.user.email || "",
            phone: json.user.phone || "",
            dni: json.user.dni || "",
            password: "",
          });


          //Inicializar estados
          if (typeof json.user.attendance === "number") {
            setAttendance(json.user.attendance);
          }

          if (typeof json.user.payment === "number") {
            setPayment(json.user.payment);
          }

          if (typeof json.user.transport === "number") {
            setTransport(json.user.transport);
          }

          if (typeof json.user.food === "number") {
            setFood(json.user.food);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const user = data?.user;


  /* =========================
     Reset estado avatar
     cuando cambia la imagen
  ========================= */

  useEffect(() => {
    setAvatarLoaded(false);
  }, [user?.avatar_url]);

  /* =========================
     Subir avatar
  ========================= */

  const uploadAvatar = async (file: File) => {
    if (!token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);

    try {
      const res = await fetch(
        `${API_URL}/me/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok)
        throw new Error("Upload failed");

      const json = await res.json();

      // Actualización local
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


  /* =========================
     Estados de participación
  ========================= */

  const [attendance, setAttendance] =
    useState<AttendanceStatus>(0);

  const [payment, setPayment] =
    useState<PaymentStatus>(0);

  const [transport, setTransport] =
    useState<TransportStatus>(0);

  const [food, setFood] =
    useState<FoodStatus>(0);


  /* =========================
     Guardar perfil
  ========================= */

  const saveProfile = async () => {
    if (!token) return;

    try {
      /* =========================
         Guardar datos de perfil
      ========================= */

      const resProfile = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const jsonProfile = await resProfile.json();

      if (!resProfile.ok) {
        throw new Error(
          jsonProfile?.error || "Error guardando perfil"
        );
      }

      /* =========================
         Guardar estado del usuario
      ========================= */

      const resStatus = await fetch(
        `${API_URL}/me/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attendance,
            payment,
            transport,
            food,
          }),
        }
      );

      const jsonStatus = await resStatus.json();

      if (!resStatus.ok) {
        throw new Error(
          jsonStatus?.error ||
            "Error guardando estado"
        );
      }

      /* =========================
         Reflejar cambios locales
      ========================= */

      setData((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                ...form,
                attendance,
                payment,
                transport,
                food,
              },
            }
          : prev
      );

      alert("Perfil y estado actualizados");
    } catch (e: any) {
      alert(
        e?.message ||
          "Error al guardar perfil y estado"
      );
    }
  };

  /* =========================
     Estados visuales
  ========================= */

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

    attendance={attendance}
    payment={payment}
    transport={transport}
    food={food}

    onToggleAttendance={toggleAttendance}
    onTogglePayment={togglePayment}
    onCycleTransport={cycleTransport}
    onCycleFood={cycleFood}
  />
);


}
