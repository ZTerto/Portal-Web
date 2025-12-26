/**
 * db.js
 * -----
 * Configuración centralizada del pool de conexiones a PostgreSQL.
 * 
 * - Usa variables de entorno para credenciales
 * - Está pensada para funcionar dentro de Docker (host: "db")
 * - El pool se reutiliza en toda la aplicación
 */

import pkg from "pg";

const { Pool } = pkg;

/**
 * Pool de conexiones a PostgreSQL
 */
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "db",
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

/**
 * Comprobación inicial de conexión.
 * No abre una conexión permanente, solo valida credenciales.
 */
pool.on("connect", () => {
  console.log("🟢 Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("🔴 Error inesperado en PostgreSQL:", err);
  process.exit(1);
});

export default pool;
