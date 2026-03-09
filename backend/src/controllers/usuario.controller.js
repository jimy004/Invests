import * as Usuario from "../models/usuario.model.js";
import * as SnapshotConfig from "../models/snapshotconfig.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[config] Missing required env var: ${name}`);
  }
  return value;
}

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const JWT_REFRESH_SECRET = getRequiredEnv("JWT_REFRESH_SECRET");
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const revokedRefreshTokens = new Set();

function signAccessToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), nombre: usuario.nombre, type: "access" },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), nombre: usuario.nombre, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN, jwtid: randomUUID() }
  );
}

export const getAll = async (req, res) => {
  res.status(403).json({ message: "Endpoint deshabilitado por seguridad" });
};

export const getMe = async (req, res) => {
  try {
    const [rows] = await Usuario.getUsuarioById(req.authUserId);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    const { password, ...usuarioSinPassword } = rows[0];
    res.json(usuarioSinPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Usuario.getUsuarioById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    
    // No devolver la contraseña por seguridad
    const { password, ...usuarioSinPassword } = rows[0];
    res.json(usuarioSinPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { nombre, password, moneda_id = 1 } = req.body;
    
    if (!nombre || !password) {
      return res.status(400).json({ message: "Nombre y password son requeridos" });
    }

    const [existentes] = await Usuario.getUsuarioByNombre(nombre);
    if (existentes.length > 0) {
      return res.status(409).json({ message: "El nombre de usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await Usuario.createUsuario({ nombre, password: hashedPassword, moneda_id });
    await SnapshotConfig.getOrCreateSnapshotConfigByUsuario(result.insertId);
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      moneda_id,
      message: "Usuario creado exitosamente" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ message: "Nombre y password son requeridos" });
    }

    const [rows] = await Usuario.getUsuarioByNombre(nombre);
    if (!rows.length) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const usuario = rows[0];
    const storedPassword = usuario.password || "";
    const isHashed = /^\$2[aby]\$/.test(storedPassword);
    const passwordMatch = isHashed
      ? await bcrypt.compare(password, storedPassword)
      : storedPassword === password;

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    if (!isHashed) {
      const migratedHash = await bcrypt.hash(password, 10);
      await Usuario.updateUsuarioPassword(usuario.id, migratedHash);
    }

    const { password: _ignored, ...usuarioSinPassword } = usuario;
    const access_token = signAccessToken(usuario);
    const refresh_token = signRefreshToken(usuario);
    res.json({
      message: "Login exitoso",
      token: access_token,
      access_token,
      refresh_token,
      expires_in: JWT_ACCESS_EXPIRES_IN,
      usuario: usuarioSinPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "refresh_token requerido" });
    }

    let payload;
    try {
      payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Refresh token invalido o expirado" });
    }

    if (payload?.type !== "refresh" || !payload?.sub) {
      return res.status(401).json({ message: "Refresh token invalido" });
    }

    if (payload.jti && revokedRefreshTokens.has(payload.jti)) {
      return res.status(401).json({ message: "Refresh token revocado" });
    }

    const [rows] = await Usuario.getUsuarioById(payload.sub);
    if (!rows.length) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    const access_token = signAccessToken(usuario);
    const new_refresh_token = signRefreshToken(usuario);

    if (payload.jti) {
      revokedRefreshTokens.add(payload.jti);
    }

    res.json({
      access_token,
      refresh_token: new_refresh_token,
      expires_in: JWT_ACCESS_EXPIRES_IN
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "refresh_token requerido" });
    }

    try {
      const payload = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
      if (payload?.jti) {
        revokedRefreshTokens.add(payload.jti);
      }
    } catch {
      // Even with invalid/expired token, keep response idempotent.
    }

    res.json({ message: "Sesion cerrada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [rows] = await Usuario.getUsuarioById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });

    const actual = rows[0];
    const nuevoNombre = req.body.nombre ?? actual.nombre;
    const nuevaMoneda = req.body.moneda_id ?? actual.moneda_id;

    let nuevoPassword = actual.password;
    if (typeof req.body.password === "string" && req.body.password.trim() !== "") {
      nuevoPassword = await bcrypt.hash(req.body.password, 10);
    }

    if (nuevoNombre !== actual.nombre) {
      const [existentes] = await Usuario.getUsuarioByNombre(nuevoNombre);
      const conflicto = existentes.find((u) => Number(u.id) !== Number(req.params.id));
      if (conflicto) {
        return res.status(409).json({ message: "El nombre de usuario ya existe" });
      }
    }

    await Usuario.updateUsuario(req.params.id, {
      nombre: nuevoNombre,
      password: nuevoPassword,
      moneda_id: nuevaMoneda
    });

    res.json({
      message: "Usuario actualizado",
      usuario: {
        id: Number(req.params.id),
        nombre: nuevoNombre,
        moneda_id: Number(nuevaMoneda)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Usuario.deleteUsuario(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
