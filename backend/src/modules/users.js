import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../core/db.js";
import bcrypt from "bcrypt";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.dni,
        u.avatar_url,
        u.score,

        COALESCE(
          JSON_AGG(
            DISTINCT jsonb_build_object(
              'id', a.id,
              'name', a.name,
              'avatar_url', a.avatar_url
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS achievements

      FROM users u
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      LEFT JOIN achievements a ON a.id = ua.achievement_id
      WHERE u.id = $1
      GROUP BY u.id
      `,
      [req.user.id]
    );

    res.json({
      user: {
        ...req.user,      // 👈 role, id, etc
        ...result.rows[0] // 👈 phone, dni, avatar, score, achievements
      }
    });
  } catch (err) {
    console.error("GET /me ERROR:", err);
    res.status(500).json({ error: "Error cargando perfil" });
  }
});


/* =====================================================
   AVATAR UPLOAD SETUP
   -----------------------------------------------------
   Configuración de subida de avatar del usuario.
===================================================== */

const avatarDir = path.resolve(process.cwd(), "uploads", "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `avatar_${req.user.id}${ext}`);
  },
});

const uploadAvatar = multer({ storage: avatarStorage });

/* =====================================================
   POST /users/me/avatar
   -----------------------------------------------------
   Permite al usuario autenticado subir o reemplazar
   su propio avatar.
===================================================== */
router.post(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      const avatar_url = `/uploads/avatars/${req.file.filename}`;

      const result = await pool.query(
        `
        UPDATE users
        SET avatar_url = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING avatar_url
        `,
        [avatar_url, req.user.id]
      );

      res.json({ avatar_url: result.rows[0].avatar_url });
    } catch (err) {
      console.error("UPLOAD AVATAR ERROR:", err);
      res.status(500).json({ error: "Error subiendo avatar" });
    }
  }
);


/* =====================================================
   PUT /me
   -----------------------------------------------------
   Actualiza perfil del usuario autenticado
   - Validación estricta de datos
   - Password opcional
===================================================== */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { name, email, phone, dni, password } = req.body;

    /* =========================
       Validaciones
    ========================= */

    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({
        error: "Email inválido",
      });
    }

    if (phone && !/^\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: "El teléfono debe tener 9 números",
      });
    }

    if (dni && !/^[A-Za-z].*|.*[A-Za-z]$/.test(dni)) {
      return res.status(400).json({
        error: "El DNI debe contener al menos una letra",
      });
    }

    /* =========================
       Construcción dinámica
    ========================= */

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (phone) {
      fields.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (dni) {
      fields.push(`dni = $${idx++}`);
      values.push(dni);
    }

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: "No hay datos válidos para actualizar",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${idx}
      RETURNING
        id,
        name,
        email,
        phone,
        dni,
        avatar_url,
        score
      `,
      [...values, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("PUT /me ERROR:", err);
    res.status(500).json({
      error: "Error actualizando perfil",
    });
  }
});


export default router;
