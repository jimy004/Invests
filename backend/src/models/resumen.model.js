import pool from "../db.js";

export const getAllResumenes = () => pool.query(`
  SELECT r.*, 
         u.nombre as usuario_nombre,
         c.categoria as categoria_nombre
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  LEFT JOIN Categoria c ON r.categoria_id = c.id
`);

export const getResumenById = (id) => pool.query(`
  SELECT r.*, 
         u.nombre as usuario_nombre,
         c.categoria as categoria_nombre
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  LEFT JOIN Categoria c ON r.categoria_id = c.id
  WHERE r.id=?
`, [id]);

export const getResumenByUsuario = (usuario_id) => pool.query(`
  SELECT r.*, 
         u.nombre as usuario_nombre,
         c.categoria as categoria_nombre,
         m.ticker as moneda_ticker,
         COALESCE(ct.total_categoria_moneda, 0) as totalCategoriaMoneda
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  LEFT JOIN Categoria c ON r.categoria_id = c.id
  LEFT JOIN Moneda m ON u.moneda_id = m.id
  LEFT JOIN (
    SELECT
      po.usuario_id,
      po.categoria_id,
      po.moneda_id,
      SUM(COALESCE(p.cantidad, 0) * COALESCE(p.preciopromedio, 0)) as total_categoria_moneda
    FROM Portafolio po
    LEFT JOIN Posicion p ON p.portafolio_id = po.id
    GROUP BY po.usuario_id, po.categoria_id, po.moneda_id
  ) ct
    ON ct.usuario_id = r.usuario_id
   AND ct.categoria_id = r.categoria_id
   AND ct.moneda_id = u.moneda_id
  WHERE r.usuario_id=?
  ORDER BY r.categoria_id
`, [usuario_id]);

export const getResumenByUsuarioConTotalesPorMoneda = (usuario_id) => pool.query(`
  SELECT
    r.*,
    u.nombre as usuario_nombre,
    c.categoria as categoria_nombre,
    um.ticker as moneda_ticker,
    pm.ticker as moneda_origen_ticker,
    a.ticker as activo_ticker,
    COALESCE(SUM(p.cantidad), 0) as cantidadTotalActivo,
    COALESCE(SUM(p.cantidad * p.preciopromedio), 0) as inversionTotalPromedioOrigen
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  LEFT JOIN Categoria c ON r.categoria_id = c.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  LEFT JOIN Portafolio po
    ON po.usuario_id = r.usuario_id
   AND po.categoria_id = r.categoria_id
  LEFT JOIN Moneda pm ON po.moneda_id = pm.id
  LEFT JOIN Posicion p ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON a.id = p.activo_id
  WHERE r.usuario_id=?
  GROUP BY
    r.id,
    r.usuario_id,
    r.pesoObjetivo,
    r.inversionInicial,
    r.categoria_id,
    u.nombre,
    c.categoria,
    um.ticker,
    pm.ticker,
    a.ticker
  ORDER BY r.categoria_id
`, [usuario_id]);

export const getInversionInicialByUsuarioConTotalesPorMoneda = (usuario_id) => pool.query(`
  SELECT
    r.id as resumen_id,
    pm.ticker as moneda_origen_ticker,
    COALESCE(SUM(
      CASE
        WHEN LOWER(TRIM(o.tipo)) = 'compra' THEN (COALESCE(o.cantidad, 0) * COALESCE(o.precio, 0)) + COALESCE(o.comision, 0)
        WHEN LOWER(TRIM(o.tipo)) = 'venta' THEN -((COALESCE(o.cantidad, 0) * COALESCE(o.precio, 0)) - COALESCE(o.comision, 0))
        ELSE 0
      END
    ), 0) as inversionInicialOrigen
  FROM Resumen r
  LEFT JOIN Portafolio po
    ON po.usuario_id = r.usuario_id
   AND po.categoria_id = r.categoria_id
  LEFT JOIN Moneda pm ON po.moneda_id = pm.id
  LEFT JOIN Posicion p ON p.portafolio_id = po.id
  LEFT JOIN Orden o ON o.posicion_id = p.id
  WHERE r.usuario_id=?
  GROUP BY r.id, pm.ticker
`, [usuario_id]);

export const getResumenByUsuarioCategoria = (usuario_id, categoria_id) => pool.query(`
  SELECT r.*, 
         u.nombre as usuario_nombre,
         c.categoria as categoria_nombre
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  LEFT JOIN Categoria c ON r.categoria_id = c.id
  WHERE r.usuario_id=? AND r.categoria_id=?
`, [usuario_id, categoria_id]);

export const createResumen = ({ 
  usuario_id, 
  pesoObjetivo = 0, 
  inversionInicial = 0, 
  categoria_id = null 
}) => pool.query(
  "INSERT INTO Resumen(usuario_id, pesoObjetivo, inversionInicial, categoria_id) VALUES(?,?,?,?)",
  [usuario_id, pesoObjetivo, inversionInicial, categoria_id]
);

export const ensureResumenByUsuarioCategoria = (usuario_id, categoria_id) => pool.query(
  `INSERT INTO Resumen(usuario_id, pesoObjetivo, inversionInicial, categoria_id)
   SELECT ?, 0, 0, ?
   WHERE NOT EXISTS (
     SELECT 1
     FROM Resumen
     WHERE usuario_id=? AND categoria_id=?
   )`,
  [usuario_id, categoria_id, usuario_id, categoria_id]
);

export const updateResumen = (id, { 
  usuario_id, 
  pesoObjetivo, 
  inversionInicial, 
  categoria_id 
}) => pool.query(
  "UPDATE Resumen SET usuario_id=?, pesoObjetivo=?, inversionInicial=?, categoria_id=? WHERE id=?",
  [usuario_id, pesoObjetivo, inversionInicial, categoria_id, id]
);

export const updateResumenPeso = (id, pesoObjetivo) => pool.query(
  "UPDATE Resumen SET pesoObjetivo=? WHERE id=?",
  [pesoObjetivo, id]
);

export const updateResumenInversion = (id, inversionInicial) => pool.query(
  "UPDATE Resumen SET inversionInicial=? WHERE id=?",
  [inversionInicial, id]
);

export const deleteResumen = (id) => pool.query(
  "DELETE FROM Resumen WHERE id=?",
  [id]
);

export const getResumenAgregadoUsuario = (usuario_id) => pool.query(`
  SELECT 
    u.nombre as usuario_nombre,
    SUM(r.pesoObjetivo) as peso_total,
    SUM(r.inversionInicial) as inversion_total,
    COUNT(r.id) as categorias_asignadas
  FROM Resumen r
  LEFT JOIN Usuario u ON r.usuario_id = u.id
  WHERE r.usuario_id=?
  GROUP BY r.usuario_id
`, [usuario_id]);

export const getCategoriaByNombre = (nombreCategoria) => pool.query(
  `SELECT id, categoria
   FROM Categoria
   WHERE LOWER(TRIM(categoria)) = LOWER(TRIM(?))
   LIMIT 1`,
  [nombreCategoria]
);
