import React from "react";

/* =========================
   Importar tipos
========================= */
import type {
  AttendanceStatus,
  PaymentStatus,
  TransportStatus,
  FoodStatus,
} from "./PerfilStatus";

/* =========================
   Tipos
========================= */

type User = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  dni?: string;
  avatar_url?: string;
  score?: number;
  achievements?: Achievement[];
};

type Achievement = {
  id: number;
  name: string;
  avatar_url?: string | null;
};

type Props = {
  user: User;

  /* formulario */
  form: {
    name: string;
    email: string;
    phone: string;
    dni: string;
    password: string;
  };
  setForm: (v: {
    name: string;
    email: string;
    phone: string;
    dni: string;
    password: string;
  }) => void;

  onSave: () => void;

  /* avatar */
  avatarLoaded: boolean;
  setAvatarLoaded: (v: boolean) => void;
  uploading: boolean;
  uploadAvatar: (file: File) => void;

  apiUrl: string;
  
  
  /* =========================
     Estados de participación
  ========================= */

  attendance: AttendanceStatus;
  payment: PaymentStatus;
  transport: TransportStatus;
  food: FoodStatus;

  onToggleAttendance: () => void;
  onTogglePayment: () => void;
  onCycleTransport: () => void;
  onCycleFood: () => void;


};


/* =========================
   Arreglos de espacios en nombres de logros
========================= */
function achievementImage(name: string, apiUrl: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `${apiUrl}/uploads/achievements/${slug}.png`;
}


/* =========================
   Componente
========================= */

export default function PerfilStatus_Render({
  user,
  form,
  setForm,
  onSave,
  uploading,
  uploadAvatar,
  apiUrl,

  attendance,
  payment,
  transport,
  food,

  onToggleAttendance,
  onTogglePayment,
  onCycleTransport,
  onCycleFood,
}: Props) {


  const avatarLetter = form.name?.charAt(0)?.toUpperCase() || "?";

  /* =========================
     Clases por estado
  ========================= */

  function attendanceClass() {
    if (attendance === 0) {
      return "rounded-lg px-4 py-4 bg-gray-400 text-gray-700 font-semibold";
    }
    return "rounded-lg px-4 py-4 bg-sky-600 text-white font-semibold";
  }

  function paymentClass() {
    if (payment === 0) {
      return "rounded-lg px-4 py-4 bg-gray-400 text-gray-700 font-semibold";
    }
    return "rounded-lg px-4 py-4 bg-green-600 text-white font-semibold";
  }

  function transportClass() {
    if (transport === 0) {
      return "rounded-lg px-4 py-4 bg-gray-400 text-gray-700 font-semibold";
    }
    if (transport === 1) {
      return "rounded-lg px-4 py-4 bg-sky-600 text-white font-semibold";
    }
    return "rounded-lg px-4 py-4 bg-indigo-800 text-white font-semibold";
  }

  function foodClass() {
    if (food === 0) {
      return "rounded-lg px-4 py-4 bg-gray-400 text-gray-700 font-semibold";
    }
    if (food === 1) {
      return "rounded-lg px-4 py-4 bg-sky-600 text-white font-semibold";
    }
    return "rounded-lg px-4 py-4 bg-indigo-800 text-white font-semibold";
  }
 
  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 text-gray-900 space-y-6">

{/* HEADER */}
<div className="flex items-center gap-4">


  {/* AVATAR */}
  <label className="relative w-26 h-26 rounded-full overflow-hidden cursor-pointer bg-indigo-600 text-white flex items-center justify-center">
    {user.avatar_url ? (
      <img
        src={`${apiUrl}${user.avatar_url}`}
        alt="Avatar"
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-3xl font-bold select-none">
        {avatarLetter}
      </span>
    )}

    <input
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadAvatar(file);
        e.currentTarget.value = "";
      }}
    />

    {uploading && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm">
        Subiendo…
      </div>
    )}
  </label>

  {/* INFO */}
  <div>
    <h1 className="text-2xl font-bold">
      {form.name || "Usuario"}
    </h1>
    <p className="text-sm text-gray-600">
      {form.email || "—"}
    </p>
    <p className="text-sm text-gray-600">
      {form.phone || "—"}
    </p>
  </div>

  {/* LOGROS */}
  <div className="ml-auto text-right">
    <p className="text-xs text-gray-500 mb-1">
      Logros
    </p>

    <div
      className="grid grid-cols-4 gap-1 justify-items-end max-w-[184px]"
      style={{ direction: "rtl" }}
    >
      {user.achievements && user.achievements.length > 0 ? (
        user.achievements.slice(0, 16).map((ach) => (
          <div
            key={ach.id}
            className="w-10 h-10 rounded-full overflow-hidden bg-gray-200"
          >
          <img
            src={achievementImage(ach.name, apiUrl)}
            alt={ach.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          </div>
        ))
      ) : (
        <span className="text-xs text-gray-400">
          Sin logros
        </span>
      )}
    </div>
  </div>

</div>


{/* =========================
    ESTADOS DE PARTICIPACIÓN
========================= */}
<div className="grid grid-cols-2 gap-2 mt-3 mb-4">

  {/* ASISTENCIA */}
<button
  className={attendanceClass()}
  onClick={onToggleAttendance}
>
  {attendance === 0 && "No puedo este año"}
  {attendance === 1 && "Quiero ir este año"}
</button>


  {/* TRANSPORTE */}
<button
  className={transportClass()}
  onClick={onCycleTransport}
>
  {transport === 0 && "Necesito transporte"}
  {transport === 1 && "Tengo transporte"}
  {transport === 2 && "Pongo transporte"}
</button>


  {/* PAGO */}
<button
  className={paymentClass()}
  onClick={onTogglePayment}
>
  {payment === 0 && "No pagado aún"}
  {payment === 1 && "Todo pagado 💰"}
</button>


  {/* COMIDA */}
<button
  className={foodClass()}
  onClick={onCycleFood}
>
  {food === 0 && "Necesito comida"}
  {food === 1 && "Gestiono mi comida"}
  {food === 2 && "Me ofrezco a cocinar"}
</button>

</div>

{/* =========================
    FORMULARIO DE PERFIL
========================= */}
<div className="space-y-4">

  <div>
    <label className="block text-sm font-medium mb-1">
      Nombre
    </label>
    <input
      className="w-full border rounded px-3 py-2"
      value={form.name}
      onChange={(e) =>
        setForm({ ...form, name: e.target.value })
      }
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Email
    </label>
    <input
      type="email"
      className="w-full border rounded px-3 py-2"
      value={form.email}
      onChange={(e) =>
        setForm({ ...form, email: e.target.value })
      }
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Teléfono
    </label>
    <input
      className="w-full border rounded px-3 py-2"
      value={form.phone}
      onChange={(e) =>
        setForm({ ...form, phone: e.target.value })
      }
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">
      Identificación (DNI / NIE)
    </label>
    <input
      className="w-full border rounded px-3 py-2"
      value={form.dni}
      onChange={(e) =>
        setForm({ ...form, dni: e.target.value })
      }
    />
  </div>

  {/* CONTRASEÑA (solo informativa) */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Contraseña
    </label>
    <div className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 tracking-widest select-none">
      ••••••••
    </div>
  </div>
</div>


        {/* ACCIONES */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
