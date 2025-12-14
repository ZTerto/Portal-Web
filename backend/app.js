import express from "express";
import cors from "cors";
import path from "path";

import pool from "./src/core/db.js";

import authRoutes from "./src/modules/auth.js";
import membersRoutes from "./src/modules/members.js";
import achievementsRoutes from "./src/modules/achievements.js";
import activitiesRoutes from "./src/modules/activities.js";

import { requireAuth } from "./src/core/middlewares.js";

const app = express();

/* =========================
   Middlewares globales
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   🔥 SERVIR ARCHIVOS SUBIDOS
   (MUY IMPORTANTE)
========================= */

app.use("/uploads", express.static("uploads"));

/* =========================
   Rutas
========================= */

app.use("/auth", authRoutes);
app.use("/members", membersRoutes);
app.use("/achievements", achievementsRoutes);
app.use("/activities", activitiesRoutes);

/* =========================
   Healthcheck
========================= */

app.get("/ping", (req, res) => {
  res.send("backend pong 🏓");
});

/* =========================
   Perfil autenticado
========================= */

app.get("/me", requireAuth, async (req, res) => {
  try {
    const roleResult = await pool.query(
      `
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    const role = roleResult.rows[0]?.name || "USER";

    res.json({
      message: "Acceso autorizado",
      user: {
        ...req.user,
        role,
      },
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default app;
