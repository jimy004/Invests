import pool from "../db.js";

export const getAllCashFlows = () => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
`);

export const getCashFlowById = (id) => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.id=?
`, [id]);

export const getCashFlowsByUsuario = (usuario_id) => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.usuario_id=?
  ORDER BY cf.fecha DESC
`, [usuario_id]);

export const getCashFlowsByUsuarioTipo = (usuario_id, tipo) => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.usuario_id=? AND cf.tipo=?
  ORDER BY cf.fecha DESC
`, [usuario_id, tipo]);

export const getCashFlowsByUsuarioPeriodo = (usuario_id, fecha_inicio, fecha_fin) => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.usuario_id=? AND cf.fecha BETWEEN ? AND ?
  ORDER BY cf.fecha DESC
`, [usuario_id, fecha_inicio, fecha_fin]);

export const getResumenCashFlowUsuario = (usuario_id) => pool.query(`
  SELECT 
    cf.usuario_id,
    u.nombre as usuario_nombre,
    um.ticker as moneda_usuario_ticker,
    SUM(CASE WHEN cf.tipo = 'ingreso' THEN cf.aporte ELSE 0 END) as total_ingresos,
    SUM(CASE WHEN cf.tipo = 'gasto' THEN cf.aporte ELSE 0 END) as total_gastos,
    COUNT(CASE WHEN cf.tipo = 'ingreso' THEN 1 END) as cantidad_ingresos,
    COUNT(CASE WHEN cf.tipo = 'gasto' THEN 1 END) as cantidad_gastos,
    (SUM(CASE WHEN cf.tipo = 'ingreso' THEN cf.aporte ELSE 0 END) - 
     SUM(CASE WHEN cf.tipo = 'gasto' THEN cf.aporte ELSE 0 END)) as saldo_neto
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.usuario_id=?
  GROUP BY cf.usuario_id, u.nombre, um.ticker
`, [usuario_id]);

export const getResumenCashFlowUsuarioPeriodo = (usuario_id, fecha_inicio, fecha_fin) => pool.query(`
  SELECT 
    cf.usuario_id,
    u.nombre as usuario_nombre,
    um.ticker as moneda_usuario_ticker,
    SUM(CASE WHEN cf.tipo = 'ingreso' THEN cf.aporte ELSE 0 END) as total_ingresos,
    SUM(CASE WHEN cf.tipo = 'gasto' THEN cf.aporte ELSE 0 END) as total_gastos,
    COUNT(CASE WHEN cf.tipo = 'ingreso' THEN 1 END) as cantidad_ingresos,
    COUNT(CASE WHEN cf.tipo = 'gasto' THEN 1 END) as cantidad_gastos,
    (SUM(CASE WHEN cf.tipo = 'ingreso' THEN cf.aporte ELSE 0 END) - 
     SUM(CASE WHEN cf.tipo = 'gasto' THEN cf.aporte ELSE 0 END)) as saldo_neto
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.usuario_id=? AND cf.fecha BETWEEN ? AND ?
  GROUP BY cf.usuario_id, u.nombre, um.ticker
`, [usuario_id, fecha_inicio, fecha_fin]);

export const getCashFlowsByTipo = (tipo) => pool.query(`
  SELECT cf.*, 
         u.nombre as usuario_nombre,
         m.nombre as moneda_nombre,
         m.ticker as moneda_ticker,
         um.ticker as moneda_usuario_ticker
  FROM CashFlow cf
  LEFT JOIN Usuario u ON cf.usuario_id = u.id
  LEFT JOIN Moneda m ON cf.moneda_id = m.id
  LEFT JOIN Moneda um ON u.moneda_id = um.id
  WHERE cf.tipo=?
  ORDER BY cf.fecha DESC
`, [tipo]);

export const createCashFlow = ({ 
  usuario_id, 
  tipo, 
  categoria = "otros",
  moneda_id = null,
  nombre, 
  fecha, 
  aporte, 
  observacion = null 
}) => pool.query(
  "INSERT INTO CashFlow(usuario_id, tipo, categoria, moneda_id, nombre, fecha, aporte, observacion) VALUES(?,?,?,?,?,?,?,?)",
  [usuario_id, tipo, categoria, moneda_id, nombre, fecha, aporte, observacion]
);

export const updateCashFlow = (id, { 
  usuario_id, 
  tipo, 
  categoria = "otros",
  moneda_id = null,
  nombre, 
  fecha, 
  aporte, 
  observacion 
}) => pool.query(
  "UPDATE CashFlow SET usuario_id=?, tipo=?, categoria=?, moneda_id=?, nombre=?, fecha=?, aporte=?, observacion=? WHERE id=?",
  [usuario_id, tipo, categoria, moneda_id, nombre, fecha, aporte, observacion, id]
);

export const deleteCashFlow = (id) => pool.query(
  "DELETE FROM CashFlow WHERE id=?",
  [id]
);
