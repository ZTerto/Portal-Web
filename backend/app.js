import express from "express";
import cors from "cors";
import path from "path";

import calendarRoutes from "./src/modules/calendar.js";
import usersRoutes from "./src/modules/users.js";
import authRoutes from "./src/modules/auth.js";
import membersRoutes from "./src/modules/members.js";
import achievementsRoutes from "./src/modules/achievements.js";
import activitiesRoutes from "./src/modules/activities.js";
import ludotecaRouter from "./src/modules/ludoteca.js";

import { requireAuth } from "./src/core/middlewares.js";

const app = express();

/* =====================================================
   Middlewares globales
   -----------------------------------------------------
   - CORS: permitir peticiones desde el frontend
   - JSON: parsear body en requests
===================================================== */
app.use(cors());
app.use(express.json());

/* =====================================================
   SERVIR ARCHIVOS SUBIDOS
   -----------------------------------------------------
   Permite acceder a:
   /uploads/avatars/...
   /uploads/ludoteca/...
===================================================== */
app.use("/uploads", express.static("uploads"));

/* =====================================================
   Rutas de la aplicación
===================================================== */

// Autenticación
app.use("/auth", authRoutes);

// Datos de usuario autenticado
app.use("/", usersRoutes);

// Miembros y administración
app.use("/members", membersRoutes);

// Contenido
app.use("/achievements", achievementsRoutes);
app.use("/activities", activitiesRoutes);
app.use("/calendar", calendarRoutes);
app.use("/ludoteca", ludotecaRouter);

/* =====================================================
   Healthcheck
===================================================== */
app.get("/ping", (_req, res) => {
  res.send("backend pong 🏓");
});

/* =====================================================
   DEBUG: Perfil autenticado
   -----------------------------------------------------
   Ruta auxiliar para comprobar requireAuth.
   No es necesaria para el frontend final.
===================================================== */
app.get("/me", requireAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 /me req.user =", req.user);
    }

    res.json({
      message: "Acceso autorizado",
      user: req.user,
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default app;
