import express from "express";
import pool from "../core/db.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();


/* =====================================================
    Configuración de multer para subir imágenes
===================================================== */
const uploadDir = "uploads/activities";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base =
      req.body.title?.toLowerCase().replace(/\s+/g, "_") ||
      "activity";
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/* =====================================================
   Multer para EDITAR imagen de actividad existente
===================================================== */
const editStorage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `activity_${req.params.id}${ext}`);
  },
});

const uploadEdit = multer({ storage: editStorage });


/* =====================================================
   POST /activities/upload-image
   ADMIN / ORGANIZER
===================================================== */
router.post(
  "/upload-image",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `/uploads/activities/${req.file.filename}`;

      res.json({ url: imageUrl });
    } catch (err) {
      console.error("UPLOAD ACTIVITY IMAGE ERROR:", err);
      res.status(500).json({ error: "Error subiendo imagen" });
    }
  }
);

/* =====================================================
   PATCH /activities/:id/image
   ADMIN / ORGANIZER / CREADOR
===================================================== */
router.patch(
  "/:id/image",
  requireAuth,
  uploadEdit.single("image"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const owner = await pool.query(
        "SELECT created_by FROM activities WHERE id = $1",
        [id]
      );

      if (
        owner.rows[0]?.created_by !== req.user.id &&
        !["ADMIN", "ORGANIZER"].includes(req.user.role)
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const imageUrl = `/uploads/activities/${req.file.filename}`;

      const result = await pool.query(
        `
        UPDATE activities
        SET image_url = $1
        WHERE id = $2
        RETURNING *
        `,
        [imageUrl, id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error("EDIT ACTIVITY IMAGE ERROR:", err);
      res.status(500).json({ error: "Error editando imagen" });
    }
  }
);


/* =====================================================
   GET /activities
   Devuelve actividades + participantes + estado usuario
===================================================== */
router.get("/", requireAuth, async (req, res) => {
  console.log("🔍 req.user =", req.user);
  try {
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

        u.name AS creator_name,

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

        COALESCE(
          BOOL_OR(ap.user_id = $1),
          false
        ) AS is_joined

      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN activity_participants ap ON ap.activity_id = a.id
      LEFT JOIN users pu ON pu.id = ap.user_id
      GROUP BY
        a.id,
        u.name
      ORDER BY a.id DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET ACTIVITIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET /activities/:id
   Detalle de una actividad
========================= */
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
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

        u.name AS creator_name,

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

        COALESCE(
          BOOL_OR(ap.user_id = $2),
          false
        ) AS is_joined

      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN activity_participants ap ON ap.activity_id = a.id
      LEFT JOIN users pu ON pu.id = ap.user_id
      WHERE a.id = $1
      GROUP BY a.id, u.name
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET ACTIVITY BY ID ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});


/* =====================================================
   POST /activities
   ADMIN / ORGANIZER
===================================================== */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

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

/* =====================================================
   POST /activities/:id/join
===================================================== */
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

    const updated = await pool.query(
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
        u.name AS creator_name,

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

        true AS is_joined

      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN activity_participants ap ON ap.activity_id = a.id
      LEFT JOIN users pu ON pu.id = ap.user_id
      WHERE a.id = $1
      GROUP BY a.id, u.name
      `,
      [activityId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("JOIN ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error apuntándose" });
  }
});

/* =====================================================
   DELETE /activities/:id/join
===================================================== */
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

    const updated = await pool.query(
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
        u.name AS creator_name,

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

        false AS is_joined

      FROM activities a
      LEFT JOIN users u ON u.id = a.created_by
      LEFT JOIN activity_participants ap ON ap.activity_id = a.id
      LEFT JOIN users pu ON pu.id = ap.user_id
      WHERE a.id = $1
      GROUP BY a.id, u.name
      `,
      [activityId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("LEAVE ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error saliendo" });
  }
});

/* =====================================================
   DELETE /activities/:id
   ADMIN o creador
===================================================== */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const owner = await pool.query(
      "SELECT created_by FROM activities WHERE id = $1",
      [id]
    );

    if (
      owner.rows[0]?.created_by !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query("DELETE FROM activities WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Error borrando actividad" });
  }
});

/* =====================================================
   DELETE /activities/:id/participants/:userId
   ADMIN / ORGANIZER / CREADOR
===================================================== */
router.delete(
  "/:id/participants/:userId",
  requireAuth,
  async (req, res) => {
    try {
      const activityId = Number(req.params.id);
      const userId = req.params.userId;

      // Comprobar propietario de la actividad
      const owner = await pool.query(
        "SELECT created_by FROM activities WHERE id = $1",
        [activityId]
      );

      if (
        owner.rows[0]?.created_by !== req.user.id &&
        !["ADMIN", "ORGANIZER"].includes(req.user.role)
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await pool.query(
        `
        DELETE FROM activity_participants
        WHERE activity_id = $1 AND user_id = $2
        `,
        [activityId, userId]
      );

      // Devolver actividad actualizada
      const updated = await pool.query(
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
          u.name AS creator_name,

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

          false AS is_joined

        FROM activities a
        LEFT JOIN users u ON u.id = a.created_by
        LEFT JOIN activity_participants ap ON ap.activity_id = a.id
        LEFT JOIN users pu ON pu.id = ap.user_id
        WHERE a.id = $1
        GROUP BY a.id, u.name
        `,
        [activityId]
      );

      res.json(updated.rows[0]);
    } catch (err) {
      console.error("REMOVE PARTICIPANT ERROR:", err);
      res.status(500).json({ error: "Error eliminando participante" });
    }
  }
);


export default router;
