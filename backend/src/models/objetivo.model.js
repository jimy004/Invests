import pool from "../db.js";

export const getByUsuario = (usuarioId) =>
  pool.query(
    `SELECT * FROM ObjetivoFinanciero WHERE usuario_id = ? ORDER BY fecha_objetivo ASC`,
    [usuarioId]
  );

export const create = ({ usuario_id, nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids }) =>
  pool.query(
    `INSERT INTO ObjetivoFinanciero (usuario_id, nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids)
     VALUES (?,?,?,?,?,?,?)`,
    [usuario_id, nombre, monto_objetivo, fecha_objetivo, monto_inicial || 0, nota || null, portafolio_ids || null]
  );

export const update = (id, { nombre, monto_objetivo, fecha_objetivo, monto_inicial, nota, portafolio_ids }) =>
  pool.query(
    `UPDATE ObjetivoFinanciero SET nombre=?, monto_objetivo=?, fecha_objetivo=?, monto_inicial=?, nota=?, portafolio_ids=?
     WHERE id=?`,
    [nombre, monto_objetivo, fecha_objetivo, monto_inicial ?? 0, nota || null, portafolio_ids || null, id]
  );

export const remove = (id) =>
  pool.query("DELETE FROM ObjetivoFinanciero WHERE id=?", [id]);

export const getOwnerUserId = async (id) => {
  const [rows] = await pool.query("SELECT usuario_id FROM ObjetivoFinanciero WHERE id=?", [id]);
  return rows.length ? Number(rows[0].usuario_id) : null;
};
