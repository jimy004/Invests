import pool from "../db.js";

export const getAllOrdenes = () => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
`);

export const getOrdenById = (id) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE o.id=?
`, [id]);

export const getOrdenesByPosicion = (posicion_id) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE o.posicion_id=?
  ORDER BY o.fecha DESC
`, [posicion_id]);

export const getOrdenesByPortafolio = (portafolio_id) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE p.portafolio_id=?
  ORDER BY o.fecha DESC
`, [portafolio_id]);

export const getOrdenesByUsuario = (usuario_id) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
  ORDER BY o.fecha DESC
`, [usuario_id]);

export const getOrdenesByActivo = (activo_id) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE p.activo_id=?
  ORDER BY o.fecha DESC
`, [activo_id]);

export const getOrdenesByTipo = (tipo) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE o.tipo=?
  ORDER BY o.fecha DESC
`, [tipo]);

export const getOrdenesByPeriodo = (fecha_inicio, fecha_fin) => pool.query(`
  SELECT o.*, 
         p.portafolio_id, p.activo_id, p.cantidad as posicion_cantidad, p.preciopromedio as posicion_preciopromedio,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (o.cantidad * o.precio) as valor_orden,
         (o.cantidad * o.precio + o.comision) as valor_total
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE o.fecha BETWEEN ? AND ?
  ORDER BY o.fecha DESC
`, [fecha_inicio, fecha_fin]);

export const getResumenOrdenesPortafolio = (portafolio_id) => pool.query(`
  SELECT 
    po.id as portafolio_id,
    po.nombre as portafolio_nombre,
    COUNT(o.id) as total_ordenes,
    SUM(CASE WHEN o.tipo = 'compra' THEN 1 ELSE 0 END) as total_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN 1 ELSE 0 END) as total_ventas,
    SUM(CASE WHEN o.tipo = 'compra' THEN o.cantidad ELSE 0 END) as cantidad_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN o.cantidad ELSE 0 END) as cantidad_ventas,
    SUM(CASE WHEN o.tipo = 'compra' THEN (o.cantidad * o.precio) ELSE 0 END) as valor_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN (o.cantidad * o.precio) ELSE 0 END) as valor_ventas,
    SUM(o.comision) as total_comisiones
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  WHERE p.portafolio_id=?
  GROUP BY po.id
`, [portafolio_id]);

export const getResumenOrdenesUsuario = (usuario_id) => pool.query(`
  SELECT 
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    COUNT(o.id) as total_ordenes,
    SUM(CASE WHEN o.tipo = 'compra' THEN 1 ELSE 0 END) as total_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN 1 ELSE 0 END) as total_ventas,
    SUM(CASE WHEN o.tipo = 'compra' THEN o.cantidad ELSE 0 END) as cantidad_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN o.cantidad ELSE 0 END) as cantidad_ventas,
    SUM(CASE WHEN o.tipo = 'compra' THEN (o.cantidad * o.precio) ELSE 0 END) as valor_compras,
    SUM(CASE WHEN o.tipo = 'venta' THEN (o.cantidad * o.precio) ELSE 0 END) as valor_ventas,
    SUM(o.comision) as total_comisiones
  FROM Orden o
  LEFT JOIN Posicion p ON o.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
  GROUP BY u.id
`, [usuario_id]);

export const getUltimoNumeroOrden = () => pool.query(`
  SELECT COALESCE(MAX(numero), 0) as ultimo_numero FROM Orden
`);

export const createOrden = ({ 
  numero = null,
  tipo, 
  posicion_id, 
  fecha = new Date().toISOString().split('T')[0], 
  cantidad, 
  precio, 
  comision = 0, 
  observacion = null 
}) => {
  // Si no se proporciona número, generamos uno automático
  if (numero === null) {
    return pool.query(`
      INSERT INTO Orden(tipo, posicion_id, fecha, cantidad, precio, comision, observacion, numero)
      VALUES(?,?,?,?,?,?,?, (SELECT siguiente_numero FROM (SELECT COALESCE(MAX(numero), 0) + 1 AS siguiente_numero FROM Orden) t))
    `, [tipo, posicion_id, fecha, cantidad, precio, comision, observacion]);
  } else {
    return pool.query(
      "INSERT INTO Orden(numero, tipo, posicion_id, fecha, cantidad, precio, comision, observacion) VALUES(?,?,?,?,?,?,?,?)",
      [numero, tipo, posicion_id, fecha, cantidad, precio, comision, observacion]
    );
  }
};

export const updateOrden = (id, { 
  numero, 
  tipo, 
  posicion_id, 
  fecha, 
  cantidad, 
  precio, 
  comision, 
  observacion 
}) => pool.query(
  "UPDATE Orden SET numero=?, tipo=?, posicion_id=?, fecha=?, cantidad=?, precio=?, comision=?, observacion=? WHERE id=?",
  [numero, tipo, posicion_id, fecha, cantidad, precio, comision, observacion, id]
);

export const deleteOrden = (id) => pool.query(
  "DELETE FROM Orden WHERE id=?",
  [id]
);

const POSITION_EPSILON = 0.00000001;

export async function recalcularPosicionDesdeOrdenes(connection, posicionId) {
  const normalizedPosicionId = Number(posicionId);
  if (!Number.isInteger(normalizedPosicionId) || normalizedPosicionId <= 0) {
    throw new Error("posicion_id invalido");
  }

  const [ordenes] = await connection.query(
    `SELECT tipo, cantidad, precio
     FROM Orden
     WHERE posicion_id=?
     ORDER BY fecha ASC, id ASC`,
    [normalizedPosicionId]
  );

  let cantidadActual = 0;
  let precioPromedioActual = 0;

  for (const orden of ordenes) {
    const tipo = String(orden?.tipo || "").toLowerCase();
    const cantidadOrden = Number(orden?.cantidad || 0);
    const precioOrden = Number(orden?.precio || 0);

    if (!Number.isFinite(cantidadOrden) || cantidadOrden <= 0) continue;
    if (!Number.isFinite(precioOrden) || precioOrden <= 0) continue;

    if (tipo === "compra") {
      const nuevaCantidad = cantidadActual + cantidadOrden;
      if (nuevaCantidad <= POSITION_EPSILON) {
        cantidadActual = 0;
        precioPromedioActual = 0;
      } else {
        precioPromedioActual =
          (cantidadActual * precioPromedioActual + cantidadOrden * precioOrden) / nuevaCantidad;
        cantidadActual = nuevaCantidad;
      }
      continue;
    }

    if (tipo === "venta") {
      if (cantidadOrden - cantidadActual > POSITION_EPSILON) {
        throw new Error("Historial de ordenes invalido: cantidad de venta superior a la disponible");
      }
      cantidadActual = Math.max(0, cantidadActual - cantidadOrden);
      if (cantidadActual <= POSITION_EPSILON) {
        cantidadActual = 0;
        precioPromedioActual = 0;
      }
    }
  }

  const [result] = await connection.query(
    "UPDATE Posicion SET cantidad=?, preciopromedio=? WHERE id=?",
    [cantidadActual, precioPromedioActual, normalizedPosicionId]
  );

  return {
    affectedRows: result.affectedRows,
    cantidad: cantidadActual,
    preciopromedio: precioPromedioActual,
    total_ordenes: ordenes.length
  };
}

export const ejecutarOrdenCompra = async (posicion_id, cantidad, precio, comision = 0, observacion = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Crear la orden de compra
    const [resultOrden] = await connection.query(`
      INSERT INTO Orden(tipo, posicion_id, fecha, cantidad, precio, comision, observacion, numero)
      VALUES('compra', ?, CURDATE(), ?, ?, ?, ?, (SELECT siguiente_numero FROM (SELECT COALESCE(MAX(numero), 0) + 1 AS siguiente_numero FROM Orden) t))
    `, [posicion_id, cantidad, precio, comision, observacion]);
    
    const ordenId = resultOrden.insertId;
    
    // Actualizar la posición (incrementar cantidad y recalcular precio promedio)
    const [resultPosicion] = await connection.query(`
      UPDATE Posicion 
      SET 
        preciopromedio = ((cantidad * preciopromedio) + (? * ?)) / (cantidad + ?),
        cantidad = cantidad + ?
      WHERE id=?
    `, [cantidad, precio, cantidad, cantidad, posicion_id]);
    
    await connection.commit();
    
    return { ordenId, affectedRows: resultPosicion.affectedRows };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const ejecutarOrdenVenta = async (posicion_id, cantidad, precio, comision = 0, observacion = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Verificar que haya suficiente cantidad en la posición
    const [posicion] = await connection.query(
      "SELECT cantidad FROM Posicion WHERE id=?",
      [posicion_id]
    );
    
    if (posicion.length === 0) {
      throw new Error('Posición no encontrada');
    }
    
    if (posicion[0].cantidad < cantidad) {
      throw new Error(`Cantidad insuficiente. Disponible: ${posicion[0].cantidad}, Solicitado: ${cantidad}`);
    }
    
    // Crear la orden de venta
    const [resultOrden] = await connection.query(`
      INSERT INTO Orden(tipo, posicion_id, fecha, cantidad, precio, comision, observacion, numero)
      VALUES('venta', ?, CURDATE(), ?, ?, ?, ?, (SELECT siguiente_numero FROM (SELECT COALESCE(MAX(numero), 0) + 1 AS siguiente_numero FROM Orden) t))
    `, [posicion_id, cantidad, precio, comision, observacion]);
    
    const ordenId = resultOrden.insertId;
    
    // Actualizar la posición (decrementar cantidad)
    const [resultPosicion] = await connection.query(`
      UPDATE Posicion 
      SET cantidad = cantidad - ?
      WHERE id=?
    `, [cantidad, posicion_id]);
    
    // Si la cantidad llegó a cero, eliminar la posición
    const [posicionActualizada] = await connection.query(
      "SELECT cantidad FROM Posicion WHERE id=?",
      [posicion_id]
    );
    
    await connection.commit();
    
    return { 
      ordenId, 
      affectedRows: resultPosicion.affectedRows,
      eliminada: posicionActualizada[0].cantidad === 0
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
