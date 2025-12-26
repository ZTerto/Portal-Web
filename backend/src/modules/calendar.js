import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   GET /calendar
   Usuario autenticado
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ce.id,
        ce.day,
        ce.zone,
        ce.start_hour,
        ce.end_hour,
        json_build_object(
          'id', a.id,
          'title', a.title,
          'type', a.type,
          'description', a.description,
          'image_url', a.image_url,
          'participants', a.participants,
          'duration', a.duration
        ) AS activity
      FROM calendar_events ce
      JOIN activities a ON a.id = ce.activity_id
      ORDER BY ce.day, ce.zone, ce.start_hour
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET /calendar ERROR:", err);
    res.status(500).json({ error: "Error obteniendo calendario" });
  }
});

/* =========================
   POST /calendar
   ADMIN + ORGANIZER
========================= */
router.post("/", requireAuth, async (req, res) => {
  const { activity_id, day, zone, start_hour, end_hour } = req.body;

  if (
    !activity_id ||
    day === undefined ||
    !zone ||
    start_hour === undefined ||
    end_hour === undefined
  ) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  // ✅ CORRECCIÓN DE ROLES
  if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO calendar_events
        (activity_id, day, zone, start_hour, end_hour, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [activity_id, day, zone, start_hour, end_hour, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /calendar ERROR:", err);

    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Ya existe una actividad en esa franja" });
    }

    res.status(500).json({ error: "Error creando evento" });
  }
});

/* =========================
   DELETE /calendar/:id
   ADMIN + ORGANIZER
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  // ✅ CORRECCIÓN DE ROLES
  if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM calendar_events
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /calendar ERROR:", err);
    res.status(500).json({ error: "Error borrando evento" });
  }
});

export default router;
