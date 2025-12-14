import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   PREPARAR DIRECTORIO
========================= */
const uploadDir = path.resolve(process.cwd(), "uploads", "activities");
fs.mkdirSync(uploadDir, { recursive: true });

/* =========================
   MULTER CONFIG (CREAR ACTIVIDAD)
========================= */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = req.body.title
      ? req.body.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "actividad";
    cb(
      null,
      `${Date.now()}_${safeName}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

/* =========================
   MULTER CONFIG (REEMPLAZAR IMAGEN)
========================= */
const replaceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `activity_${req.params.id}${ext}`);
  },
});

const replaceUpload = multer({ storage: replaceStorage });

/* =========================
   HELPERS
========================= */
async function fetchActivitiesForUser(userId) {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.title,
      a.type,
      a.description,
      a.participants,
      a.duration,
      a.image_url,
      a.created_by,
      a.created_at,
      cu.name AS creator_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pu.id,
            'name', pu.name,
            'avatar_url', pu.avatar_url,
            'joined_at', ap.joined_at
          )
          ORDER BY ap.joined_at ASC
        ) FILTER (WHERE pu.id IS NOT NULL),
        '[]'::json
      ) AS participants_list,
      COALESCE(BOOL_OR(ap.user_id = $1), false) AS is_joined
    FROM activities a
    LEFT JOIN users cu ON cu.id = a.created_by
    LEFT JOIN activity_participants ap ON ap.activity_id = a.id
    LEFT JOIN users pu ON pu.id = ap.user_id
    GROUP BY
      a.id,
      a.title,
      a.type,
      a.description,
      a.participants,
      a.duration,
      a.image_url,
      a.created_by,
      a.created_at,
      cu.name
    ORDER BY a.id DESC
    `,
    [userId]
  );

  return result.rows;
}

/* 🔧 FUNCIÓN QUE FALTABA (ARREGLA EL 500) */
async function fetchOneActivityForUser(activityId, userId) {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.title,
      a.type,
      a.description,
      a.participants,
      a.duration,
      a.image_url,
      a.created_by,
      a.created_at,
      cu.name AS creator_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pu.id,
            'name', pu.name,
            'avatar_url', pu.avatar_url,
            'joined_at', ap.joined_at
          )
          ORDER BY ap.joined_at ASC
        ) FILTER (WHERE pu.id IS NOT NULL),
        '[]'::json
      ) AS participants_list,
      COALESCE(BOOL_OR(ap.user_id = $2), false) AS is_joined
    FROM activities a
    LEFT JOIN users cu ON cu.id = a.created_by
    LEFT JOIN activity_participants ap ON ap.activity_id = a.id
    LEFT JOIN users pu ON pu.id = ap.user_id
    WHERE a.id = $1
    GROUP BY
      a.id,
      a.title,
      a.type,
      a.description,
      a.participants,
      a.duration,
      a.image_url,
      a.created_by,
      a.created_at,
      cu.name
    `,
    [activityId, userId]
  );

  return result.rows[0];
}

/* =========================
   GET ACTIVITIES
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await fetchActivitiesForUser(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error("GET ACTIVITIES ERROR:", err);
    res.status(500).json({ error: "Error cargando actividades" });
  }
});

/* =========================
   UPLOAD IMAGE (CREAR)
========================= */
router.post(
  "/upload-image",
  requireAuth,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image received" });
    }

    const url = `/uploads/activities/${req.file.filename}`;
    res.json({ url });
  }
);

/* =========================
   CREATE ACTIVITY
========================= */
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      participants,
      duration,
      image_url,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO activities
        (title, type, description, participants, duration, image_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        title,
        type,
        description,
        participants || null,
        duration || null,
        image_url || null,
        req.user.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error creando actividad" });
  }
});

/* =========================
   JOIN ACTIVITY
========================= */
router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const activityId = Number(req.params.id);
    const userId = req.user.id;

    await pool.query(
      `
      INSERT INTO activity_participants (activity_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [activityId, userId]
    );

    const updated = await fetchOneActivityForUser(activityId, userId);
    res.json(updated);
  } catch (err) {
    console.error("JOIN ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error al apuntarse" });
  }
});

/* =========================
   LEAVE ACTIVITY
========================= */
router.delete("/:id/join", requireAuth, async (req, res) => {
  try {
    const activityId = Number(req.params.id);
    const userId = req.user.id;

    await pool.query(
      `
      DELETE FROM activity_participants
      WHERE activity_id = $1 AND user_id = $2
      `,
      [activityId, userId]
    );

    const updated = await fetchOneActivityForUser(activityId, userId);
    res.json(updated);
  } catch (err) {
    console.error("LEAVE ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error al salir" });
  }
});

/* =========================
   REMOVE USER FROM ACTIVITY (ADMIN / ORGANIZER)
========================= */
router.delete("/:id/participants/:userId", requireAuth, async (req, res) => {
  try {
    const activityId = Number(req.params.id);
    const userIdToRemove = req.params.userId;

    await pool.query(
      `
      DELETE FROM activity_participants
      WHERE activity_id = $1 AND user_id = $2
      `,
      [activityId, userIdToRemove]
    );

    const updated = await fetchOneActivityForUser(
      activityId,
      req.user.id
    );

    res.json(updated);
  } catch (err) {
    console.error("REMOVE PARTICIPANT ERROR:", err);
    res.status(500).json({ error: "Error retirando usuario" });
  }
});


/* =========================
   REPLACE ACTIVITY IMAGE
========================= */
router.patch(
  "/:id/image",
  requireAuth,
  replaceUpload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const image_url = `/uploads/activities/${req.file.filename}`;

      const result = await pool.query(
        `
        UPDATE activities
        SET image_url = $1
        WHERE id = $2
        RETURNING *
        `,
        [image_url, id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error("REPLACE IMAGE ERROR:", err);
      res.status(500).json({ error: "Error reemplazando imagen" });
    }
  }
);

/* =========================
   DELETE ACTIVITY
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM activities WHERE id = $1",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error borrando actividad" });
  }
});


export default router;
