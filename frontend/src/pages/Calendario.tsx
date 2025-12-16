import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

// Días de la semana (2 columnas por día)
const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// Horas visibles: 12:00 → 04:00
const HOURS = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  0, 1, 2, 3, 4,
];

// Definición de tipos
type Activity = {
  id: number;
  title: string;
  image_url?: string;
};

// Definición del tipo de datos de un evento del calendario
type CalendarEvent = {
  id: number;
  day: number;
  zone: number;
  start_hour: number;
  end_hour: number;
  activity: Activity;
};

// Componente principal de la página de calendario
export default function Calendario() {
  const { canAdmin, canOrganize, token } = useAuth();
  const navigate = useNavigate();

  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] =
    useState<number | null>(null);

  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [rowHeight, setRowHeight] = useState(48);

  //20251215
  // Calcular altura de filas según espacio disponible
  useEffect(() => {
    const calculate = () => {
      const BORDER_Y = 3;
      if (!gridRef.current) return;
      const available = gridRef.current.clientHeight - BORDER_Y * HOURS.length;
      const calculated = Math.floor(available / HOURS.length);
      setRowHeight(Math.max(calculated, 32));
    };

    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

//20251215
// Función para cargar los eventos del calendario
  const loadCalendar = async () => {
    if (!token) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/calendar`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setCalendarEvents(await res.json());
  };

  useEffect(() => {
    loadCalendar().catch(console.error);
  }, [token]);

//20251215
// Obtener actividades
  useEffect(() => {
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setActivities)
      .catch(console.error);
  }, [token]);

//20251215
// Reset selección
  function resetSelection() {
    setIsSelecting(false);
    setSelectedCol(null);
    setStartIndex(null);
    setEndIndex(null);
    setSelectedActivityId(null);
  }


/* =========================
   Render
========================= */
  return (
    <div className="p-6 overflow-x-auto select-none relative h-full flex flex-col">
      <div className="w-full overflow-hidden relative flex flex-col flex-1">
        {/* Header días */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "56px repeat(14, 1fr)" }}
        >
          <div />
          {DAYS.map((day) => (
            <div
              key={day}
              className="col-span-2 border-b border-gray-700 py-1 flex items-center justify-center"
            >
              <span className="text-sm font-medium">{day}</span>
            </div>
          ))}
        </div>

        {/* Grid + eventos */}
        <div className="relative flex-1" ref={gridRef}>
          <div
            className="grid w-full"
            style={{ gridTemplateColumns: "56px repeat(14, 1fr)" }}
          >
            {HOURS.map((hour, hourIndex) => (
              <Fragment key={hourIndex}>
                <div className="border-r border-gray-700 text-xs text-gray-400 px-1 py-1">
                  {formatHour(hour)}
                </div>

                {Array.from({ length: 14 }).map((_, colIndex) => {
                  const isHovered = hoveredCol === colIndex;

                  const isSelected =
                    selectedCol === colIndex &&
                    startIndex !== null &&
                    endIndex !== null &&
                    hourIndex >= Math.min(startIndex, endIndex) &&
                    hourIndex <= Math.max(startIndex, endIndex);

                  return (
                    <div
                      key={colIndex}
                      onMouseEnter={() => {
                        setHoveredCol(colIndex);
                        if (isSelecting && selectedCol === colIndex) {
                          setEndIndex(hourIndex);
                        }
                      }}
                      onMouseLeave={() => setHoveredCol(null)}
                      onMouseDown={() => {
                        setIsSelecting(true);
                        setSelectedCol(colIndex);
                        setStartIndex(hourIndex);
                        setEndIndex(hourIndex);
                      }}
                      onMouseUp={() => {
                        setIsSelecting(false);

                        if (!canAdmin && !canOrganize) {
                          resetSelection();
                          return;
                        }

                        if (
                          selectedCol !== null &&
                          startIndex !== null &&
                          endIndex !== null &&
                          startIndex !== endIndex
                        ) {
                          setShowModal(true);
                        }
                      }}
                      className={[
                        "border border-gray-800 box-border transition cursor-pointer",
                        isHovered && "bg-gray-800/30",
                        isSelected && "bg-indigo-500/30",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ height: rowHeight}}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Eventos */}
          {calendarEvents.map((ev) => {
            const col = ev.day * 2 + (ev.zone - 1);
            const startIdx = HOURS.indexOf(ev.start_hour);
            const endIdx = HOURS.indexOf(ev.end_hour);
            if (startIdx === -1 || endIdx === -1) return null;

            const columnWidth = `calc((100% - 56px) / 14)`;
            const left = `calc(56px + ${col} * ${columnWidth})`;

            return (
              <div
                key={ev.id}
                onClick={() =>
                  navigate(`/actividades/${ev.activity.id}`)
                }
                className="
                  absolute rounded overflow-hidden
                  text-xs text-white
                  shadow-xl ring-1 ring-black/30
                  transition-transform duration-150
                  hover:scale-[1.02]
                  cursor-pointer
                "
                style={{
                  top: startIdx * rowHeight,
                  height: (endIdx - startIdx + 1) * rowHeight,
                  left,
                  width: columnWidth,
                  backgroundImage: ev.activity.image_url
                    ? `url(${import.meta.env.VITE_API_URL}${ev.activity.image_url})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {(canAdmin || canOrganize) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm("¿Borrar esta franja?")) return;

                      fetch(
                        `${import.meta.env.VITE_API_URL}/calendar/${ev.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      ).then(loadCalendar);
                    }}
                    className="
                      absolute top-1 right-1
                      w-5 h-5
                      rounded-full
                      bg-black/60
                      text-white
                      text-xs
                      flex items-center justify-center
                      hover:bg-red-600
                      z-20
                    "
                  >
                    ×
                  </button>
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-black/10" />
                <div className="relative z-10 p-1 font-semibold truncate">
                  {ev.activity.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">
              Asignar actividad
            </h2>

            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 mb-4"
              value={selectedActivityId ?? ""}
              onChange={(e) =>
                setSelectedActivityId(Number(e.target.value))
              }
            >
              <option value="">Selecciona una actividad</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetSelection();
                }}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
              >
                Cancelar
              </button>

              <button
                disabled={!selectedActivityId}
                onClick={async () => {
                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/calendar`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        activity_id: selectedActivityId,
                        day: Math.floor(selectedCol! / 2),
                        zone: selectedCol! % 2 === 0 ? 1 : 2,
                        start_hour:
                          HOURS[Math.min(startIndex!, endIndex!)],
                        end_hour:
                          HOURS[Math.max(startIndex!, endIndex!)],
                      }),
                    }
                  );

                  if (!res.ok) {
                    alert(await res.text());
                    return;
                  }

                  await loadCalendar();
                  setShowModal(false);
                  resetSelection();
                }}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Utilidades
========================= */

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}
