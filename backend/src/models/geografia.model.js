import pool from "../db.js";

export const getAllGeografias = () => pool.query("SELECT * FROM Geografia");
export const getGeografiaById = (id) => pool.query("SELECT * FROM Geografia WHERE id=?", [id]);
export const createGeografia = ({ geografia }) => pool.query(
  "INSERT INTO Geografia(geografia) VALUES(?)",
  [geografia]
);
export const updateGeografia = (id, { geografia }) => pool.query(
  "UPDATE Geografia SET geografia=? WHERE id=?",
  [geografia, id]
);
export const deleteGeografia = (id) => pool.query(
  "DELETE FROM Geografia WHERE id=?",
  [id]
);

// Obtener fondos por geografía
export const getFondosByGeografia = (geografia_id) => pool.query(`
  SELECT df.*, a.nombre as activo_nombre, a.ticker, g.nombre as gestora_nombre,
         po.politica, t.tipo, geo.geografia, s.nombre as sector_nombre
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.geografia_id=?
`, [geografia_id]);