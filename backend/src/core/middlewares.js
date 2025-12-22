import { verifyToken } from "./jwt.js";
import pool from "./db.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  try {
    // 1️⃣ Verificar token
    const decoded = verifyToken(token);

    // 2️⃣ Cargar usuario REAL desde la BD
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(
          ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS roles
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

    // 3️⃣ Usuario completo con roles
    req.user = result.rows[0];

    console.log("REQ.USER:", req.user);  // LOG DE PRUEBA
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Token inválido" });
  }
}
