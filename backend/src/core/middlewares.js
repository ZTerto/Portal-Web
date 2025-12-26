/**
 * middlewares.js
 * --------------
 * Middlewares centrales de AUTENTICACIÓN.
 *
 * RESPONSABILIDADES:
 * 1️⃣ Verificar la identidad del usuario mediante JWT
 * 2️⃣ Cargar el usuario REAL desde la base de datos
 * 3️⃣ Determinar y exponer su rol principal
 *
 * NOTA IMPORTANTE:
 * - Este archivo NO decide permisos de negocio
 * - La autorización por rol se gestiona principalmente en el frontend
 */

import { verifyToken } from "./jwt.js";
import pool from "./db.js";

/* =====================================================
   🔐 AUTHENTICATION
   ===================================================== */

/**
 * requireAuth
 * -----------
 * Middleware de autenticación.
 *
 * Flujo:
 * 1️⃣ Lee el header Authorization
 * 2️⃣ Valida formato "Bearer <token>"
 * 3️⃣ Verifica el JWT (firma + expiración)
 * 4️⃣ Carga el usuario desde la base de datos
 * 5️⃣ Determina su rol principal según jerarquía
 *
 * Jerarquía de roles:
 *   admin > organizer > user
 *
 * Resultado:
 *   req.user = {
 *     id,
 *     name,
 *     email,
 *     role
 *   }
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  try {
    const decoded = verifyToken(token);

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.dni,
        u.avatar_url,
        u.score,

        COALESCE(
          MAX(
            CASE
              WHEN r.name = 'ADMIN' THEN 'ADMIN'
              WHEN r.name = 'ORGANIZER' THEN 'ORGANIZER'
            END
          ),
          'USER'
        ) AS role

      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
      `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
