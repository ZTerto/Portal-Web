import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   GET /achievements
   Usuario autenticado
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, avatar_url
      FROM achievements
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET ACHIEVEMENTS ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* =========================
   POST /achievements
   ADMIN + ORGANIZER
========================= */
router.post("/", requireAuth, async (req, res) => {
  try {
    // 🔐 Autorización basada en el rol ya cargado por requireAuth
    if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { name, description } = req.body;

    if (!name || !name.trim() || !description || !description.trim()) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // 🔹 Generar ruta automática del avatar
    const slug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/\s+/g, "-"); // espacios → guiones

    const avatarUrl = `/uploads/achievements/${slug}.png`;

    const result = await pool.query(
      `
      INSERT INTO achievements (name, description, avatar_url)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, avatar_url
      `,
      [name.trim(), description.trim(), avatarUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE ACHIEVEMENT ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* =========================
   DELETE /achievements/:id
   SOLO ADMIN
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // 🔐 Solo administradores pueden borrar logros
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query(
      "DELETE FROM achievements WHERE id = $1",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACHIEVEMENT ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
