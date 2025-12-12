import express from "express";
import bcrypt from "bcrypt";
import pool from "../core/db.js";
import { signToken } from "../core/jwt.js";

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, dni, phone, email, password } = req.body;

    // 1️⃣ Validación básica
    if (!name || !dni || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 2️⃣ Comprobar duplicados
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR dni = $2",
      [email, dni]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Usuario ya existente" });
    }

    // 3️⃣ Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 4️⃣ Crear usuario
    const userResult = await pool.query(
      `
      INSERT INTO users (name, dni, phone, email, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email
      `,
      [name, dni, phone || null, email, passwordHash]
    );

    const user = userResult.rows[0];

    // 5️⃣ Asignar rol USER
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'USER'"
    );

    await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [user.id, roleResult.rows[0].id]
    );

    // 6️⃣ Crear JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // 7️⃣ Respuesta final
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE name = $1",
      [name]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
