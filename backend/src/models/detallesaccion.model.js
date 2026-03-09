import pool from "../db.js";

export const getAllDetallesAcciones = () => pool.query(`
  SELECT da.*, 
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         s.nombre as sector_nombre, s.icono as sector_icono, s.descripcion as sector_descripcion
  FROM DetallesAccion da
  LEFT JOIN Activo a ON da.activo_id = a.id
  LEFT JOIN Sector s ON da.sector_id = s.id
`);

export const getDetallesAccionById = (id) => pool.query(`
  SELECT da.*, 
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         s.nombre as sector_nombre, s.icono as sector_icono, s.descripcion as sector_descripcion
  FROM DetallesAccion da
  LEFT JOIN Activo a ON da.activo_id = a.id
  LEFT JOIN Sector s ON da.sector_id = s.id
  WHERE da.id=?
`, [id]);

export const getDetallesAccionByActivo = (activo_id) => pool.query(`
  SELECT da.*, 
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         s.nombre as sector_nombre, s.icono as sector_icono, s.descripcion as sector_descripcion
  FROM DetallesAccion da
  LEFT JOIN Activo a ON da.activo_id = a.id
  LEFT JOIN Sector s ON da.sector_id = s.id
  WHERE da.activo_id=?
`, [activo_id]);

export const getDetallesAccionBySector = (sector_id) => pool.query(`
  SELECT da.*, 
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         s.nombre as sector_nombre, s.icono as sector_icono, s.descripcion as sector_descripcion
  FROM DetallesAccion da
  LEFT JOIN Activo a ON da.activo_id = a.id
  LEFT JOIN Sector s ON da.sector_id = s.id
  WHERE da.sector_id=?
`, [sector_id]);

export const searchDetallesAcciones = (filters) => {
  let query = `
    SELECT da.*, 
           a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
           s.nombre as sector_nombre, s.icono as sector_icono, s.descripcion as sector_descripcion
    FROM DetallesAccion da
    LEFT JOIN Activo a ON da.activo_id = a.id
    LEFT JOIN Sector s ON da.sector_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.activo_id) {
    query += ' AND da.activo_id = ?';
    params.push(filters.activo_id);
  }
  
  if (filters.sector_id) {
    query += ' AND da.sector_id = ?';
    params.push(filters.sector_id);
  }
  
  if (filters.search) {
    query += ' AND (a.nombre LIKE ? OR a.ticker LIKE ? OR s.nombre LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  
  return pool.query(query, params);
};

export const getAccionesBySectorResumen = () => pool.query(`
  SELECT 
    s.id as sector_id,
    s.nombre as sector_nombre,
    s.icono as sector_icono,
    COUNT(da.id) as total_acciones,
    GROUP_CONCAT(DISTINCT a.ticker ORDER BY a.ticker) as tickers_ejemplo
  FROM DetallesAccion da
  LEFT JOIN Activo a ON da.activo_id = a.id
  LEFT JOIN Sector s ON da.sector_id = s.id
  GROUP BY s.id
  ORDER BY s.nombre
`);

export const createDetallesAccion = ({ 
  activo_id, 
  sector_id 
}) => pool.query(
  "INSERT INTO DetallesAccion(activo_id, sector_id) VALUES(?,?)",
  [activo_id, sector_id]
);

export const updateDetallesAccion = (id, { 
  activo_id, 
  sector_id 
}) => pool.query(
  "UPDATE DetallesAccion SET activo_id=?, sector_id=? WHERE id=?",
  [activo_id, sector_id, id]
);

export const deleteDetallesAccion = (id) => pool.query(
  "DELETE FROM DetallesAccion WHERE id=?",
  [id]
);

export const deleteDetallesAccionByActivo = (activo_id) => pool.query(
  "DELETE FROM DetallesAccion WHERE activo_id=?",
  [activo_id]
);

// Método para obtener o crear detalles de acción para un activo
export const getOrCreateDetallesAccion = async (activo_id, sector_id = null) => {
  // Primero intentar encontrar detalles existentes
  const [existentes] = await pool.query(
    "SELECT * FROM DetallesAccion WHERE activo_id=?",
    [activo_id]
  );
  
  if (existentes.length > 0) {
    // Si existe y se proporcionó un sector_id diferente, actualizar
    if (sector_id && existentes[0].sector_id !== sector_id) {
      await pool.query(
        "UPDATE DetallesAccion SET sector_id=? WHERE id=?",
        [sector_id, existentes[0].id]
      );
      existentes[0].sector_id = sector_id;
      existentes[0].actualizado = true;
    }
    return existentes[0];
  }
  
  // Si no existe, crear nuevos detalles
  if (!sector_id) {
    throw new Error('Se requiere sector_id para crear nuevos detalles de acción');
  }
  
  const [result] = await pool.query(
    "INSERT INTO DetallesAccion(activo_id, sector_id) VALUES(?,?)",
    [activo_id, sector_id]
  );
  
  return {
    id: result.insertId,
    activo_id,
    sector_id,
    creado: true
  };
};