import express from "express";
import pool from "../core/db.js";
import { requireAuth } from "../core/middlewares.js";

const router = express.Router();

/* =====================================================
   GET /members
   Listado de miembros + roles + logros
   Usuario autenticado
===================================================== */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar_url,

        -- Roles asociados (informativo)
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

/* =====================================================
   POST /members/:id/achievements
   Asignar logro (ADMIN + ORGANIZER)
===================================================== */
router.post("/:id/achievements", requireAuth, async (req, res) => {
  try {
    // 🔐 Autorización basada en rol normalizado
    if (!["ADMIN", "ORGANIZER"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { achievementId } = req.body;
    const userId = req.params.id;

    if (!achievementId) {
      return res.status(400).json({
        error: "achievementId requerido",
      });
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

/* =====================================================
   DELETE /members/:id/achievements/:achievementId
   Quitar logro (SOLO ADMIN)
===================================================== */
router.delete(
  "/:id/achievements/:achievementId",
  requireAuth,
  async (req, res) => {
    try {
      // 🔐 Solo administradores
      if (req.user.role !== "ADMIN") {
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
  }
);

/* =====================================================
   DELETE /members/:id
   SOLO ADMIN
===================================================== */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 🔐 Solo administradores pueden borrar usuarios
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Opcional: impedir borrarse a sí mismo
    if (req.user.id === id) {
      return res.status(400).json({
        error: "No puedes borrarte a ti mismo",
      });
    }

    // Borrar relaciones primero (si no hay ON DELETE CASCADE)
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

export default router;


/* =====================================================
   PATCH /members/:id/role
   Cambiar rol de un usuario
   SOLO ADMIN
===================================================== */
router.patch("/:id/role", requireAuth, async (req, res) => {
  try {
    // 🔐 Solo ADMIN
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { role } = req.body; // "ADMIN" | "ORGANIZER" | "USER"

    if (!["ADMIN", "ORGANIZER", "USER"].includes(role)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    // 1️⃣ Obtener role_id
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      [role]
    );

    if (roleResult.rowCount === 0) {
      return res.status(400).json({ error: "Rol no existe" });
    }

    const roleId = roleResult.rows[0].id;

    // 2️⃣ Limpiar roles anteriores
    await pool.query(
      "DELETE FROM user_roles WHERE user_id = $1",
      [id]
    );

    // 3️⃣ Asignar nuevo rol
    await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [id, roleId]
    );

    res.json({ success: true, role });
  } catch (err) {
    console.error("UPDATE ROLE ERROR:", err);
    res.status(500).json({ error: "Error actualizando rol" });
  }
});
