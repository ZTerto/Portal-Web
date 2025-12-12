import { verifyToken } from "./jwt.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}
