import pool from "../db.js";

export const getAllPosiciones = () => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
`);

export const getPosicionById = (id) => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
  WHERE p.id=?
`, [id]);

export const getPosicionesByPortafolio = (portafolio_id) => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
  WHERE p.portafolio_id=?
  ORDER BY (p.cantidad * p.preciopromedio) DESC
`, [portafolio_id]);

export const getPosicionesByUsuario = (usuario_id) => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
  WHERE po.usuario_id=?
  ORDER BY (p.cantidad * p.preciopromedio) DESC
`, [usuario_id]);

export const getPosicionesByActivo = (activo_id) => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
  WHERE p.activo_id=?
`, [activo_id]);

export const getPosicionesByActivoUsuario = (activo_id, usuario_id) => pool.query(`
  SELECT p.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono, a.categoria_id as activo_categoria_id,
         u.nombre as usuario_nombre,
         g.nombre as gestora_nombre, g.icono as gestora_icono, df.gestora_id as gestora_id,
         mpo.ticker as portafolio_moneda_ticker,
         (p.cantidad * p.preciopromedio) as valor_actual,
         p.preciopromedio as precio_actual,
         (p.cantidad * p.preciopromedio) as valor_total,
         CASE
           WHEN p.preciopromedio > 0 THEN ((p.preciopromedio - p.preciopromedio) / p.preciopromedio) * 100
           ELSE 0
         END as rentabilidad
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN DetallesFondo df ON df.activo_id = a.id
  LEFT JOIN Gestora g ON df.gestora_id = g.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
  WHERE p.activo_id=? AND po.usuario_id=?
`, [activo_id, usuario_id]);

export const getResumenPortafolio = (portafolio_id) => pool.query(`
  SELECT 
    po.id as portafolio_id,
    po.nombre as portafolio_nombre,
    COUNT(p.id) as total_posiciones,
    SUM(p.cantidad) as cantidad_total,
    SUM(p.cantidad * p.preciopromedio) as valor_total,
    AVG(p.preciopromedio) as precio_promedio_promedio
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  WHERE p.portafolio_id=?
  GROUP BY po.id
`, [portafolio_id]);

export const getResumenUsuario = (usuario_id) => pool.query(`
  SELECT 
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    COUNT(DISTINCT po.id) as total_portafolios,
    COUNT(p.id) as total_posiciones,
    SUM(p.cantidad * p.preciopromedio) as valor_total_invertido,
    SUM(p.cantidad) as cantidad_total_activos
  FROM Posicion p
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
  GROUP BY u.id
`, [usuario_id]);

export const createPosicion = ({ 
  portafolio_id, 
  activo_id, 
  cantidad = 0, 
  preciopromedio = 0 
}) => pool.query(
  "INSERT INTO Posicion(portafolio_id, activo_id, cantidad, preciopromedio) VALUES(?,?,?,?)",
  [portafolio_id, activo_id, cantidad, preciopromedio]
);

export const updatePosicion = (id, { 
  portafolio_id, 
  activo_id, 
  cantidad, 
  preciopromedio 
}) => pool.query(
  "UPDATE Posicion SET portafolio_id=?, activo_id=?, cantidad=?, preciopromedio=? WHERE id=?",
  [portafolio_id, activo_id, cantidad, preciopromedio, id]
);

export const updatePosicionCantidad = (id, cantidad) => pool.query(
  "UPDATE Posicion SET cantidad=? WHERE id=?",
  [cantidad, id]
);

export const updatePosicionPrecio = (id, preciopromedio) => pool.query(
  "UPDATE Posicion SET preciopromedio=? WHERE id=?",
  [preciopromedio, id]
);

export const deletePosicion = (id) => pool.query(
  "DELETE FROM Posicion WHERE id=?",
  [id]
);

export const incrementarPosicion = (id, cantidad_incremento, precio_compra) => {
  return pool.query(`
    UPDATE Posicion 
    SET 
      preciopromedio = ((cantidad * preciopromedio) + (? * ?)) / (cantidad + ?),
      cantidad = cantidad + ?
    WHERE id=?
  `, [cantidad_incremento, precio_compra, cantidad_incremento, cantidad_incremento, id]);
};

export const decrementarPosicion = (id, cantidad_decremento) => {
  return pool.query(`
    UPDATE Posicion 
    SET cantidad = cantidad - ?
    WHERE id=? AND cantidad >= ?
  `, [cantidad_decremento, id, cantidad_decremento]);
};

export const buscarPosicionPorPortafolioActivo = (portafolio_id, activo_id) => pool.query(`
  SELECT * FROM Posicion 
  WHERE portafolio_id=? AND activo_id=?
`, [portafolio_id, activo_id]);
