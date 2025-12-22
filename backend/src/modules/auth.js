import express from "express";
import bcrypt from "bcrypt";
import pool from "../core/db.js";
import { signToken } from "../core/jwt.js";

const router = express.Router();

/* =========================
   VALIDACIÓN REGISTER
========================= */
function validateRegisterInput({ name, dni, phone, email, password }) {
  if (!name || !name.trim()) {
    return "El nombre no puede estar vacío";
  }

  if (dni) {
    const hasDigit = /\d/.test(dni);
    const startsOrEndsWithLetter =
      /^[A-Za-z]/.test(dni) || /[A-Za-z]$/.test(dni);

    if (!hasDigit || !startsOrEndsWithLetter) {
      return "DNI inválido";
    }
  }

  if (phone) {
    if (!/^\d{9}$/.test(phone)) {
      return "El teléfono debe tener exactamente 9 dígitos";
    }
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Email inválido";
  }

  if (!password) {
    return "La contraseña no puede estar vacía";
  }

  return null;
}

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, dni, phone, email, password } = req.body;

    // 1️⃣ Validación de formato
    const validationError = validateRegisterInput(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // 2️⃣ Nombre único (ÚNICA restricción)
    const nameExists = await pool.query(
      "SELECT id FROM users WHERE name = $1",
      [name]
    );

    if (nameExists.rows.length > 0) {
      return res.status(409).json({
        error: "Ese nombre ya está en uso",
      });
    }

    // 2️⃣ DNI único (si viene informado)
    if (dni) {
      const dniExists = await pool.query(
        "SELECT id FROM users WHERE dni = $1",
      [dni]
    );

    if (dniExists.rows.length > 0) {
      return res.status(409).json({
          error: "Ese DNI ya está registrado",
        });
      }
    }

    // 3️⃣ Teléfono único (si viene informado)
    if (phone) {
      const phoneExists = await pool.query(
        "SELECT id FROM users WHERE phone = $1",
      [phone]
    );

  if (phoneExists.rows.length > 0) {
    return res.status(409).json({
      error: "Ese teléfono ya está registrado",
    });
  }
}

    // 3️⃣ Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 4️⃣ Crear usuario (email, dni y phone pueden repetirse)
    const userResult = await pool.query(
      `
      INSERT INTO users (name, dni, phone, email, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email
      `,
      [
        name.trim(),
        dni || null,
        phone || null,
        email.trim(),
        passwordHash,
      ]
    );

    const user = userResult.rows[0];

    // 5️⃣ Asignar rol USER por defecto
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = 'USER'"
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        error: "Rol USER no configurado en el sistema",
      });
    }

    await pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [user.id, roleResult.rows[0].id]
    );

    // 6️⃣ Crear JWT
    const token = signToken({
      id: user.id,
      name: user.name,
    });

    // 7️⃣ Respuesta final
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
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
