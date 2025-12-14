import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =========================
   Helpers
========================= */

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
   GET /members
   Listado de miembros + roles + logros
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,

        -- Rol único
        ARRAY_AGG(DISTINCT r.name)
          FILTER (WHERE r.name IS NOT NULL) AS roles,

        -- Logros
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
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      LEFT JOIN achievements a ON a.id = ua.achievement_id
      GROUP BY u.id
      ORDER BY u.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("MEMBERS ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* =========================
   POST /members/:id/achievements
   Asignar logro (ADMIN y ORGANIZER)
========================= */
router.post("/:id/achievements", requireAuth, async (req, res) => {
  try {
    const actorRole = await getUserRole(req.user.id);

    if (!["ADMIN", "ORGANIZER"].includes(actorRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { achievementId } = req.body;
    const userId = req.params.id;

    if (!achievementId) {
      return res.status(400).json({ error: "achievementId requerido" });
    }

    await pool.query(
      `
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userId, achievementId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ADD ACHIEVEMENT ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* =========================
   DELETE /members/:id/achievements/:achievementId
   Quitar logro (solo ADMIN)
========================= */
router.delete("/:id/achievements/:achievementId", requireAuth, async (req, res) => {
  try {
    const actorRole = await getUserRole(req.user.id);

    if (actorRole !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id: userId, achievementId } = req.params;

    await pool.query(
      `
      DELETE FROM user_achievements
      WHERE user_id = $1 AND achievement_id = $2
      `,
      [userId, achievementId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("REMOVE ACHIEVEMENT ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;


/* =========================
   DELETE MEMBER (ADMIN)
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Opcional: impedir borrarse a sí mismo
    if (req.user.id === id) {
      return res.status(400).json({
        error: "No puedes borrarte a ti mismo",
      });
    }

    // Borrar relaciones primero (si no tienes ON DELETE CASCADE)
    await pool.query(
      "DELETE FROM user_roles WHERE user_id = $1",
      [id]
    );
    await pool.query(
      "DELETE FROM user_achievements WHERE user_id = $1",
      [id]
    );

    // Borrar usuario
    await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE MEMBER ERROR:", err);
    res.status(500).json({ error: "Error borrando usuario" });
  }
});
