import pool from "../db.js";

export const getByUsuario = (usuarioId) =>
  pool.query(
    `SELECT pa.*, a.nombre as activo_nombre, a.ticker
     FROM PrecioAlerta pa
     INNER JOIN Activo a ON pa.activo_id = a.id
     WHERE pa.usuario_id = ?
     ORDER BY pa.created_at DESC`,
    [usuarioId]
  );

export const create = ({ usuario_id, activo_id, tipo, precio_objetivo }) =>
  pool.query(
    "INSERT INTO PrecioAlerta (usuario_id, activo_id, tipo, precio_objetivo) VALUES (?,?,?,?)",
    [usuario_id, activo_id, tipo, precio_objetivo]
  );

export const update = (id, { tipo, precio_objetivo, activa }) =>
  pool.query(
    "UPDATE PrecioAlerta SET tipo=?, precio_objetivo=?, activa=? WHERE id=?",
    [tipo, precio_objetivo, activa, id]
  );

export const remove = (id) =>
  pool.query("DELETE FROM PrecioAlerta WHERE id=?", [id]);

export const getOwnerUserId = async (id) => {
  const [rows] = await pool.query("SELECT usuario_id FROM PrecioAlerta WHERE id=?", [id]);
  return rows.length ? Number(rows[0].usuario_id) : null;
};

export const getActiveAlerts = () =>
  pool.query(
    `SELECT pa.*, a.ticker
     FROM PrecioAlerta pa
     INNER JOIN Activo a ON pa.activo_id = a.id
     WHERE pa.activa = 1`
  );
