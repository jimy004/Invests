import pool from "../db.js";

export const getAllTipos = () => pool.query("SELECT * FROM Tipo");
export const getTipoById = (id) => pool.query("SELECT * FROM Tipo WHERE id=?", [id]);
export const createTipo = ({ tipo }) => pool.query(
  "INSERT INTO Tipo(tipo) VALUES(?)",
  [tipo]
);
export const updateTipo = (id, { tipo }) => pool.query(
  "UPDATE Tipo SET tipo=? WHERE id=?",
  [tipo, id]
);
export const deleteTipo = (id) => pool.query(
  "DELETE FROM Tipo WHERE id=?",
  [id]
);

// Obtener fondos por tipo
export const getFondosByTipo = (tipo_id) => pool.query(`
  SELECT df.*, a.nombre as activo_nombre, a.ticker, g.nombre as gestora_nombre,
         po.politica, t.tipo, geo.geografia, s.nombre as sector_nombre
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.tipo_id=?
`, [tipo_id]);