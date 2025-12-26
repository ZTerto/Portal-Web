import Calendario_Render from "./Calendario_Render";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../utils/AuthContext";

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

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Calendario() {
  // Revisión de permisos
  const { token, user } = useAuth();
  //console.log("🧑 user desde useAuth:", user);
  //console.log("🎭 user?.role:", user?.role);
  const canAdmin = user?.role === "ADMIN";
  const canOrganize = user?.role === "ADMIN" || user?.role === "ORGANIZER";

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

  useEffect(() => {
    const calculate = () => {
      const BORDER_Y = 3;
      if (!gridRef.current) return;
      const available =
        gridRef.current.clientHeight - BORDER_Y * HOURS.length;
      const calculated = Math.floor(
        available / HOURS.length
      );
      setRowHeight(Math.max(calculated, 32));
    };

    calculate();
    window.addEventListener("resize", calculate);
    return () =>
      window.removeEventListener("resize", calculate);
  }, []);

  const loadCalendar = async () => {
    if (!token) return;

    const res = await fetch(`${API_URL}/calendar`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setCalendarEvents(await res.json());
  };

  useEffect(() => {
    loadCalendar().catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setActivities)
      .catch(console.error);
  }, [token]);

  function resetSelection() {
    setIsSelecting(false);
    setSelectedCol(null);
    setStartIndex(null);
    setEndIndex(null);
    setSelectedActivityId(null);
  }

  return (
    <Calendario_Render
      canAdmin={canAdmin}
      canOrganize={canOrganize}
      token={token}
      hoveredCol={hoveredCol}
      setHoveredCol={setHoveredCol}
      isSelecting={isSelecting}
      setIsSelecting={setIsSelecting}
      selectedCol={selectedCol}
      setSelectedCol={setSelectedCol}
      startIndex={startIndex}
      setStartIndex={setStartIndex}
      endIndex={endIndex}
      setEndIndex={setEndIndex}
      showModal={showModal}
      setShowModal={setShowModal}
      selectedActivityId={selectedActivityId}
      setSelectedActivityId={setSelectedActivityId}
      calendarEvents={calendarEvents}
      activities={activities}
      rowHeight={rowHeight}
      gridRef={gridRef}
      resetSelection={resetSelection}
      loadCalendar={loadCalendar}
      apiUrl={API_URL}
    />
  );
}
