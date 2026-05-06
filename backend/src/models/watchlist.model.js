import pool from "../db.js";

export const getByUsuario = (usuarioId) =>
  pool.query(
    `SELECT w.*, a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id
     FROM Watchlist w
     INNER JOIN Activo a ON w.activo_id = a.id
     WHERE w.usuario_id = ?
     ORDER BY w.created_at DESC`,
    [usuarioId]
  );

export const create = ({ usuario_id, activo_id, nota }) =>
  pool.query(
    "INSERT INTO Watchlist (usuario_id, activo_id, nota) VALUES (?,?,?)",
    [usuario_id, activo_id, nota || null]
  );

export const updateNota = (id, nota) =>
  pool.query("UPDATE Watchlist SET nota=? WHERE id=?", [nota || null, id]);

export const remove = (id) =>
  pool.query("DELETE FROM Watchlist WHERE id=?", [id]);

export const getOwnerUserId = async (id) => {
  const [rows] = await pool.query("SELECT usuario_id FROM Watchlist WHERE id=?", [id]);
  return rows.length ? Number(rows[0].usuario_id) : null;
};
