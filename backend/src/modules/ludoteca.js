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

const uploadDir = path.resolve(process.cwd(), "uploads", "ludoteca");
fs.mkdirSync(uploadDir, { recursive: true });

/* =========================
   MULTER CONFIG (CREAR)
========================= */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = req.body.title
      ? req.body.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      : "ludoteca";
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
    cb(null, `ludoteca_${req.params.id}${ext}`);
  },
});

const replaceUpload = multer({ storage: replaceStorage });

/* =========================
   HELPERS
========================= */

async function fetchLudotecaForUser(userId) {
  const result = await pool.query(
    `
    SELECT
      l.id,
      l.title,
      l.type,
      l.description,
      l.participants,
      l.duration,
      l.image_url,
      l.created_by,
      l.created_at,
      cu.name AS creator_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pu.id,
            'name', pu.name,
            'avatar_url', pu.avatar_url,
            'joined_at', lp.joined_at
          )
          ORDER BY lp.joined_at ASC
        ) FILTER (WHERE pu.id IS NOT NULL),
        '[]'::json
      ) AS participants_list,
      COALESCE(BOOL_OR(lp.user_id = $1), false) AS is_joined
    FROM ludoteca l
    LEFT JOIN users cu ON cu.id = l.created_by
    LEFT JOIN ludoteca_participants lp ON lp.ludoteca_id = l.id
    LEFT JOIN users pu ON pu.id = lp.user_id
    GROUP BY
      l.id,
      l.title,
      l.type,
      l.description,
      l.participants,
      l.duration,
      l.image_url,
      l.created_by,
      l.created_at,
      cu.name
    ORDER BY l.id DESC
    `,
    [userId]
  );

  return result.rows;
}

async function fetchOneLudotecaForUser(ludotecaId, userId) {
  const result = await pool.query(
    `
    SELECT
      l.id,
      l.title,
      l.type,
      l.description,
      l.participants,
      l.duration,
      l.image_url,
      l.created_by,
      l.created_at,
      cu.name AS creator_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pu.id,
            'name', pu.name,
            'avatar_url', pu.avatar_url,
            'joined_at', lp.joined_at
          )
          ORDER BY lp.joined_at ASC
        ) FILTER (WHERE pu.id IS NOT NULL),
        '[]'::json
      ) AS participants_list,
      COALESCE(BOOL_OR(lp.user_id = $2), false) AS is_joined
    FROM ludoteca l
    LEFT JOIN users cu ON cu.id = l.created_by
    LEFT JOIN ludoteca_participants lp ON lp.ludoteca_id = l.id
    LEFT JOIN users pu ON pu.id = lp.user_id
    WHERE l.id = $1
    GROUP BY
      l.id,
      l.title,
      l.type,
      l.description,
      l.participants,
      l.duration,
      l.image_url,
      l.created_by,
      l.created_at,
      cu.name
    `,
    [ludotecaId, userId]
  );

  return result.rows[0];
}

/* =========================
   GET LUDOTECA
========================= */

router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await fetchLudotecaForUser(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error("GET LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error cargando ludoteca" });
  }
});

/* =========================
   GET LUDOTECA BY ID
========================= */

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await fetchOneLudotecaForUser(id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: "No encontrado" });
    }

    res.json(item);
  } catch (err) {
    console.error("GET LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error cargando item" });
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

    const url = `/uploads/ludoteca/${req.file.filename}`;
    res.json({ url });
  }
);

/* =========================
   CREATE LUDOTECA
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
      INSERT INTO ludoteca
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
    console.error("CREATE LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error creando ludoteca" });
  }
});

/* =========================
   ME INTERESA
========================= */

router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const ludotecaId = Number(req.params.id);
    const userId = req.user.id;

    await pool.query(
      `
      INSERT INTO ludoteca_participants (ludoteca_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [ludotecaId, userId]
    );

    const updated = await fetchOneLudotecaForUser(
      ludotecaId,
      userId
    );
    res.json(updated);
  } catch (err) {
    console.error("JOIN LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error marcando interés" });
  }
});

/* =========================
   QUITAR INTERÉS
========================= */

router.delete("/:id/join", requireAuth, async (req, res) => {
  try {
    const ludotecaId = Number(req.params.id);
    const userId = req.user.id;

    await pool.query(
      `
      DELETE FROM ludoteca_participants
      WHERE ludoteca_id = $1 AND user_id = $2
      `,
      [ludotecaId, userId]
    );

    const updated = await fetchOneLudotecaForUser(
      ludotecaId,
      userId
    );
    res.json(updated);
  } catch (err) {
    console.error("LEAVE LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error quitando interés" });
  }
});

/* =========================
   REEMPLAZAR IMAGEN (SOLO CREADOR)
========================= */

router.patch(
  "/:id/image",
  requireAuth,
  replaceUpload.single("image"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const owner = await pool.query(
        "SELECT created_by FROM ludoteca WHERE id = $1",
        [id]
      );

      if (owner.rows[0]?.created_by !== req.user.id) {
        return res.status(403).json({ error: "No autorizado" });
      }

      const image_url = `/uploads/ludoteca/${req.file.filename}`;

      const result = await pool.query(
        `
        UPDATE ludoteca
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
   DELETE LUDOTECA (SOLO CREADOR)
========================= */

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const owner = await pool.query(
      "SELECT created_by FROM ludoteca WHERE id = $1",
      [id]
    );

    if (owner.rows[0]?.created_by !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await pool.query("DELETE FROM ludoteca WHERE id = $1", [
      id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE LUDOTECA ERROR:", err);
    res.status(500).json({ error: "Error borrando ludoteca" });
  }
});

export default router;
