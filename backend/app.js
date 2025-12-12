import express from "express";
import cors from "cors";

import authRoutes from "./src/modules/auth.js";
import { requireAuth } from "./src/core/middlewares.js";

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use("/auth", authRoutes);

// Healthcheck
app.get("/ping", (req, res) => {
  res.send("backend pong 🏓");
});

// Ruta protegida de prueba
app.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "Acceso autorizado",
    user: req.user,
  });
});

export default app;
