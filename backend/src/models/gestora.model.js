import pool from "../db.js";

export const getAllGestoras = () => pool.query("SELECT * FROM Gestora");
export const getGestoraById = (id) => pool.query("SELECT * FROM Gestora WHERE id=?", [id]);
export const createGestora = ({ nombre, icono = null, descripcion = null }) => pool.query(
  "INSERT INTO Gestora(nombre, icono, descripcion) VALUES(?,?,?)",
  [nombre, icono, descripcion]
);
export const updateGestora = (id, { nombre, icono, descripcion }) => pool.query(
  "UPDATE Gestora SET nombre=?, icono=?, descripcion=? WHERE id=?",
  [nombre, icono, descripcion, id]
);
export const deleteGestora = (id) => pool.query(
  "DELETE FROM Gestora WHERE id=?",
  [id]
);

// Obtener fondos gestionados por una gestora específica
export const getFondosByGestora = (gestora_id) => pool.query(`
  SELECT df.*, a.nombre as activo_nombre, a.ticker, g.nombre as gestora_nombre,
         po.politica, t.tipo, geo.geografia, s.nombre as sector_nombre
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.gestora_id=?
`, [gestora_id]);