import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

async function getUserRole(userId) {
  const result = await pool.query(
    `
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.name || null;
}

/* =========================
   GET /achievements
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
    const role = await getUserRole(req.user.id);

    if (!["ADMIN", "ORGANIZER"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { name, description } = req.body;

    if (!name || !name.trim() || !description || !description.trim()) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const result = await pool.query(
      `
      INSERT INTO achievements (name, description, avatar_url)
      VALUES ($1, $2, NULL)
      RETURNING id, name, description, avatar_url
      `,
      [name.trim(), description.trim()]
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
    const role = await getUserRole(req.user.id);

    if (role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query("DELETE FROM achievements WHERE id = $1", [
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACHIEVEMENT ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
