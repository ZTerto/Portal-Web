import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   GET /calendar
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
    console.error("GET /calendar error:", err);
    res.status(500).send("Error obteniendo calendario");
  }
});

/* =========================
   POST /calendar
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
    return res.status(400).send("Datos incompletos");
  }

  /*
    if (
      req.user?.role !== "ADMIN" &&
      req.user?.role !== "ORGANIZER"
    ) {
      return res.status(403).send("No autorizado");
    }
  */

  try {
    const result = await pool.query(
      `
      INSERT INTO calendar_events
        (activity_id, day, zone, start_hour, end_hour, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        activity_id,
        day,
        zone,
        start_hour,
        end_hour,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /calendar error:", err);

    if (err.code === "23505") {
      return res
        .status(409)
        .send("Ya existe una actividad en esa franja");
    }

    res.status(500).send("Error creando evento");
  }
});

/* =========================
   DELETE /calendar/:id
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

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
      return res.status(404).send("Evento no encontrado");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /calendar error:", err);
    res.status(500).send("Error borrando evento");
  }
});

export default router;
