import pool from "../db.js";

export const getAllDetallesFondo = () => pool.query(`
  SELECT df.*, 
         a.nombre as activo_nombre, a.ticker as activo_ticker, a.icono as activo_icono,
         g.nombre as gestora_nombre, g.icono as gestora_icono,
         po.politica,
         t.tipo,
         geo.geografia,
         s.nombre as sector_nombre, s.icono as sector_icono
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
`);

export const getDetallesFondoById = (id) => pool.query(`
  SELECT df.*, 
         a.nombre as activo_nombre, a.ticker as activo_ticker, a.icono as activo_icono,
         g.nombre as gestora_nombre, g.icono as gestora_icono,
         po.politica,
         t.tipo,
         geo.geografia,
         s.nombre as sector_nombre, s.icono as sector_icono
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.id=?
`, [id]);

export const getDetallesFondoByActivo = (activo_id) => pool.query(`
  SELECT df.*, 
         a.nombre as activo_nombre, a.ticker as activo_ticker, a.icono as activo_icono,
         g.nombre as gestora_nombre, g.icono as gestora_icono,
         po.politica,
         t.tipo,
         geo.geografia,
         s.nombre as sector_nombre, s.icono as sector_icono
  FROM DetallesFondo df
  LEFT JOIN Activo a ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Politica po ON df.politica_id = po.id
  LEFT JOIN Tipo t ON df.tipo_id = t.id
  LEFT JOIN Geografia geo ON df.geografia_id = geo.id
  LEFT JOIN Sector s ON df.sector_id = s.id
  WHERE df.activo_id=?
`, [activo_id]);

export const searchDetallesFondo = (filters) => {
  let query = `
    SELECT df.*, 
           a.nombre as activo_nombre, a.ticker as activo_ticker, a.icono as activo_icono,
           g.nombre as gestora_nombre, g.icono as gestora_icono,
           po.politica,
           t.tipo,
           geo.geografia,
           s.nombre as sector_nombre, s.icono as sector_icono
    FROM DetallesFondo df
    LEFT JOIN Activo a ON df.activo_id = a.id
    LEFT JOIN Gestora g ON df.gestora_id = g.id
    LEFT JOIN Politica po ON df.politica_id = po.id
    LEFT JOIN Tipo t ON df.tipo_id = t.id
    LEFT JOIN Geografia geo ON df.geografia_id = geo.id
    LEFT JOIN Sector s ON df.sector_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.activo_id) {
    query += ' AND df.activo_id = ?';
    params.push(filters.activo_id);
  }
  
  if (filters.gestora_id) {
    query += ' AND df.gestora_id = ?';
    params.push(filters.gestora_id);
  }
  
  if (filters.politica_id) {
    query += ' AND df.politica_id = ?';
    params.push(filters.politica_id);
  }
  
  if (filters.tipo_id) {
    query += ' AND df.tipo_id = ?';
    params.push(filters.tipo_id);
  }
  
  if (filters.geografia_id) {
    query += ' AND df.geografia_id = ?';
    params.push(filters.geografia_id);
  }
  
  if (filters.sector_id) {
    query += ' AND df.sector_id = ?';
    params.push(filters.sector_id);
  }
  
  if (filters.search) {
    query += ' AND (a.nombre LIKE ? OR a.ticker LIKE ? OR g.nombre LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  
  return pool.query(query, params);
};

export const createDetallesFondo = ({ 
  activo_id, 
  gestora_id, 
  politica_id, 
  tipo_id, 
  geografia_id, 
  sector_id 
}) => pool.query(
  "INSERT INTO DetallesFondo(activo_id, gestora_id, politica_id, tipo_id, geografia_id, sector_id) VALUES(?,?,?,?,?,?)",
  [activo_id, gestora_id, politica_id, tipo_id, geografia_id, sector_id]
);

export const updateDetallesFondo = (id, { 
  activo_id, 
  gestora_id, 
  politica_id, 
  tipo_id, 
  geografia_id, 
  sector_id 
}) => pool.query(
  "UPDATE DetallesFondo SET activo_id=?, gestora_id=?, politica_id=?, tipo_id=?, geografia_id=?, sector_id=? WHERE id=?",
  [activo_id, gestora_id, politica_id, tipo_id, geografia_id, sector_id, id]
);

export const deleteDetallesFondo = (id) => pool.query(
  "DELETE FROM DetallesFondo WHERE id=?",
  [id]
);