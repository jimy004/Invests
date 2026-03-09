import pool from "../db.js";

export const getAllPoliticas = () => pool.query("SELECT * FROM Politica");
export const getPoliticaById = (id) => pool.query("SELECT * FROM Politica WHERE id=?", [id]);
export const createPolitica = ({ politica }) => pool.query(
  "INSERT INTO Politica(politica) VALUES(?)",
  [politica]
);
export const updatePolitica = (id, { politica }) => pool.query(
  "UPDATE Politica SET politica=? WHERE id=?",
  [politica, id]
);
export const deletePolitica = (id) => pool.query(
  "DELETE FROM Politica WHERE id=?",
  [id]
);

// Obtener fondos por política de inversión
export const getFondosByPolitica = (politica_id) => pool.query(`
  SELECT df.*, a.nombre as activo_nombre, a.ticker, g.nombre as gestora_nombre,
         po.politica, t.tipo, geo.geografia, s.nombre as sector_nombre
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.politica_id=?
`, [politica_id]);