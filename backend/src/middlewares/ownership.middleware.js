import pool from "../db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("[config] Missing required env var: JWT_SECRET");
}

export function requireAuthUser(req, res, next) {
  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization Bearer token requerido" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = Number(payload?.sub);
    if (payload?.type !== "access" || !Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Token invalido" });
    }
    req.authUserId = userId;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
}

export function ensureUsuarioParamMatchesAuth(paramName = "usuario_id") {
  return (req, res, next) => {
    const paramUserId = Number(req.params[paramName]);
    if (!Number.isInteger(paramUserId) || paramUserId <= 0) {
      return res.status(400).json({ message: `${paramName} invalido` });
    }
    if (paramUserId !== req.authUserId) {
      return res.status(403).json({ message: "No autorizado para este usuario" });
    }
    next();
  };
}

export function ensureUsuarioBodyMatchesAuth(fieldName = "usuario_id") {
  return (req, res, next) => {
    const bodyUserId = Number(req.body?.[fieldName]);
    if (!Number.isInteger(bodyUserId) || bodyUserId <= 0) {
      return res.status(400).json({ message: `${fieldName} invalido` });
    }
    if (bodyUserId !== req.authUserId) {
      return res.status(403).json({ message: "No autorizado para este usuario" });
    }
    next();
  };
}

async function getPortafolioOwnerUserId(portafolioId) {
  const [rows] = await pool.query("SELECT usuario_id FROM Portafolio WHERE id=?", [portafolioId]);
  return rows.length ? Number(rows[0].usuario_id) : null;
}

export function ensurePortafolioParamOwned(paramName = "portafolio_id") {
  return async (req, res, next) => {
    try {
      const portafolioId = Number(req.params[paramName]);
      if (!Number.isInteger(portafolioId) || portafolioId <= 0) {
        return res.status(400).json({ message: `${paramName} invalido` });
      }
      const ownerUserId = await getPortafolioOwnerUserId(portafolioId);
      if (!ownerUserId) return res.status(404).json({ message: "Portafolio no encontrado" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para este portafolio" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

export function ensurePortafolioBodyOwned(fieldName = "portafolio_id") {
  return async (req, res, next) => {
    try {
      const portafolioId = Number(req.body?.[fieldName]);
      if (!Number.isInteger(portafolioId) || portafolioId <= 0) {
        return res.status(400).json({ message: `${fieldName} invalido` });
      }
      const ownerUserId = await getPortafolioOwnerUserId(portafolioId);
      if (!ownerUserId) return res.status(404).json({ message: "Portafolio no encontrado" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para este portafolio" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

export function ensurePortafolioIdParamOwned(paramName = "id") {
  return async (req, res, next) => {
    try {
      const portafolioId = Number(req.params[paramName]);
      if (!Number.isInteger(portafolioId) || portafolioId <= 0) {
        return res.status(400).json({ message: `${paramName} invalido` });
      }
      const ownerUserId = await getPortafolioOwnerUserId(portafolioId);
      if (!ownerUserId) return res.status(404).json({ message: "Portafolio no encontrado" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para este portafolio" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

async function getPosicionOwnerUserId(posicionId) {
  const [rows] = await pool.query(
    `SELECT po.usuario_id
     FROM Posicion p
     INNER JOIN Portafolio po ON p.portafolio_id = po.id
     WHERE p.id=?`,
    [posicionId]
  );
  return rows.length ? Number(rows[0].usuario_id) : null;
}

export function ensurePosicionParamOwned(paramName = "id") {
  return async (req, res, next) => {
    try {
      const posicionId = Number(req.params[paramName]);
      if (!Number.isInteger(posicionId) || posicionId <= 0) {
        return res.status(400).json({ message: `${paramName} invalido` });
      }
      const ownerUserId = await getPosicionOwnerUserId(posicionId);
      if (!ownerUserId) return res.status(404).json({ message: "Posicion no encontrada" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para esta posicion" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

export function ensurePosicionBodyOwned(fieldName = "posicion_id") {
  return async (req, res, next) => {
    try {
      const posicionId = Number(req.body?.[fieldName]);
      if (!Number.isInteger(posicionId) || posicionId <= 0) {
        return res.status(400).json({ message: `${fieldName} invalido` });
      }
      const ownerUserId = await getPosicionOwnerUserId(posicionId);
      if (!ownerUserId) return res.status(404).json({ message: "Posicion no encontrada" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para esta posicion" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

async function getOrdenOwnerUserId(ordenId) {
  const [rows] = await pool.query(
    `SELECT po.usuario_id
     FROM Orden o
     INNER JOIN Posicion p ON o.posicion_id = p.id
     INNER JOIN Portafolio po ON p.portafolio_id = po.id
     WHERE o.id=?`,
    [ordenId]
  );
  return rows.length ? Number(rows[0].usuario_id) : null;
}

export function ensureOrdenParamOwned(paramName = "id") {
  return async (req, res, next) => {
    try {
      const ordenId = Number(req.params[paramName]);
      if (!Number.isInteger(ordenId) || ordenId <= 0) {
        return res.status(400).json({ message: `${paramName} invalido` });
      }
      const ownerUserId = await getOrdenOwnerUserId(ordenId);
      if (!ownerUserId) return res.status(404).json({ message: "Orden no encontrada" });
      if (ownerUserId !== req.authUserId) {
        return res.status(403).json({ message: "No autorizado para esta orden" });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
