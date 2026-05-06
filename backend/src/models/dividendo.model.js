import pool from "../db.js";

export const getByPortafolio = (portafolioId) =>
  pool.query(
    `SELECT d.*, p.activo_id, a.nombre as activo_nombre, a.ticker, m.ticker as moneda_ticker
     FROM Dividendo d
     INNER JOIN Posicion p ON d.posicion_id = p.id
     INNER JOIN Activo a ON p.activo_id = a.id
     LEFT JOIN Moneda m ON d.moneda_id = m.id
     WHERE p.portafolio_id = ?
     ORDER BY d.fecha DESC`,
    [portafolioId]
  );

export const getByUsuario = (usuarioId) =>
  pool.query(
    `SELECT d.*, p.activo_id, a.nombre as activo_nombre, a.ticker, m.ticker as moneda_ticker,
            po.nombre as portafolio_nombre
     FROM Dividendo d
     INNER JOIN Posicion p ON d.posicion_id = p.id
     INNER JOIN Portafolio po ON p.portafolio_id = po.id
     INNER JOIN Activo a ON p.activo_id = a.id
     LEFT JOIN Moneda m ON d.moneda_id = m.id
     WHERE po.usuario_id = ?
     ORDER BY d.fecha DESC`,
    [usuarioId]
  );

export const create = ({ posicion_id, fecha, importe, moneda_id, observacion }) =>
  pool.query(
    "INSERT INTO Dividendo (posicion_id, fecha, importe, moneda_id, observacion) VALUES (?,?,?,?,?)",
    [posicion_id, fecha, importe, moneda_id || null, observacion || null]
  );

export const update = (id, { fecha, importe, moneda_id, observacion }) =>
  pool.query(
    "UPDATE Dividendo SET fecha=?, importe=?, moneda_id=?, observacion=? WHERE id=?",
    [fecha, importe, moneda_id || null, observacion || null, id]
  );

export const remove = (id) =>
  pool.query("DELETE FROM Dividendo WHERE id=?", [id]);

export const getOwnerUserId = async (id) => {
  const [rows] = await pool.query(
    `SELECT po.usuario_id FROM Dividendo d
     INNER JOIN Posicion p ON d.posicion_id = p.id
     INNER JOIN Portafolio po ON p.portafolio_id = po.id
     WHERE d.id=?`,
    [id]
  );
  return rows.length ? Number(rows[0].usuario_id) : null;
};
