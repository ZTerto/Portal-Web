import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   DATA OF USER
========================= */
router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT
      id,
      name,
      email,
      phone,
      dni,
      avatar_url,
      score
    FROM users
    WHERE id = $1
  `, [req.user.id]);

  res.json({ user: result.rows[0] });
});


/* =========================
   AVATAR UPLOAD SETUP
========================= */
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

/* =========================
   UPLOAD AVATAR (USER)
========================= */
router.post(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
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

export default router;
