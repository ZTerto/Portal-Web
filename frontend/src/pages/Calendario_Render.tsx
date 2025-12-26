import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const HOURS = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  0, 1, 2, 3, 4,
];

type Activity = {
  id: number;
  title: string;
  image_url?: string;
};

type CalendarEvent = {
  id: number;
  day: number;
  zone: number;
  start_hour: number;
  end_hour: number;
  activity: Activity;
};

type Props = {
  canAdmin: boolean;
  canOrganize: boolean;
  token?: string;
  hoveredCol: number | null;
  setHoveredCol: (v: number | null) => void;
  isSelecting: boolean;
  setIsSelecting: (v: boolean) => void;
  selectedCol: number | null;
  setSelectedCol: (v: number | null) => void;
  startIndex: number | null;
  setStartIndex: (v: number | null) => void;
  endIndex: number | null;
  setEndIndex: (v: number | null) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  selectedActivityId: number | null;
  setSelectedActivityId: (v: number | null) => void;
  calendarEvents: CalendarEvent[];
  activities: Activity[];
  rowHeight: number;
  gridRef: React.RefObject<HTMLDivElement>;
  resetSelection: () => void;
  loadCalendar: () => Promise<void>;
  apiUrl: string;
};

export default function Calendario_Render({
  canAdmin,
  canOrganize,
  token,
  hoveredCol,
  setHoveredCol,
  isSelecting,
  setIsSelecting,
  selectedCol,
  setSelectedCol,
  startIndex,
  setStartIndex,
  endIndex,
  setEndIndex,
  showModal,
  setShowModal,
  selectedActivityId,
  setSelectedActivityId,
  calendarEvents,
  activities,
  rowHeight,
  gridRef,
  resetSelection,
  loadCalendar,
  apiUrl,
}: Props) {
  const navigate = useNavigate();

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
              <span className="text-xs font-medium">{day}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
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
                      style={{ height: rowHeight }}
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
                onClick={() => navigate(`/actividades/${ev.activity.id}`)
                }
                className="absolute rounded overflow-hidden text-xs text-white shadow-xl ring-1 ring-black/30 cursor-pointer"
                style={{
                  top: startIdx * rowHeight,
                  height: (endIdx - startIdx + 1) * rowHeight,
                  left,
                  width: columnWidth,
                  backgroundImage: ev.activity.image_url
                    ? `url(${apiUrl}${ev.activity.image_url})`
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

                      fetch(`${apiUrl}/calendar/${ev.id}`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }).then(loadCalendar);
                    }}
                    className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full bg-black/60 text-white text-xs"
                  >
                    ×
                  </button>
                )}

                <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/75 via-black/20 to-black/10" />
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
                className="px-3 py-1 rounded bg-gray-700"
              >
                Cancelar
              </button>

              <button
                disabled={!selectedActivityId}
                onClick={async () => {
                  const res = await fetch(`${apiUrl}/calendar`, {
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
                  });

                  if (!res.ok) {
                    alert(await res.text());
                    return;
                  }

                  await loadCalendar();
                  setShowModal(false);
                  resetSelection();
                }}
                className="px-3 py-1 rounded bg-indigo-600 disabled:opacity-50"
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

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}
