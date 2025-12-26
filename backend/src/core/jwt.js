/**
 * jwt.js
 * ------
 * Utilidades centralizadas para firmar y verificar JWT.
 * 
 * IMPORTANTE:
 * - JWT_SECRET debe estar definido en variables de entorno
 * - Este archivo NO debe contener lógica de negocio
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// Seguridad: no permitir arrancar sin secret
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET no está definido en las variables de entorno");
}

/**
 * Firma un JWT con el payload proporcionado.
 * 
 * @param {Object} payload - Datos a incluir en el token (ej: userId, role)
 * @returns {string} JWT firmado
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica y decodifica un JWT.
 * 
 * @param {string} token - JWT sin el prefijo 'Bearer'
 * @returns {Object} Payload decodificado
 * @throws Error si el token es inválido o ha expirado
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
