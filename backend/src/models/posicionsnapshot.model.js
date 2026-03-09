import pool from "../db.js";
import { fetchYahooPriceBySymbol, fetchYahooQuoteBySymbol } from "../services/yahoo.service.js";

const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_MS || 5 * 60 * 1000);
const fxRateCache = new Map();

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function getCachedFxRate(fromTicker, toTicker) {
  const key = `${fromTicker}->${toTicker}`;
  const cached = fxRateCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    fxRateCache.delete(key);
    return null;
  }
  return cached.rate;
}

function setCachedFxRate(fromTicker, toTicker, rate) {
  const key = `${fromTicker}->${toTicker}`;
  fxRateCache.set(key, {
    rate,
    expiresAt: Date.now() + Math.max(1000, FX_CACHE_TTL_MS)
  });
}

async function getFxRate(fromTickerRaw, toTickerRaw) {
  const fromTicker = normalizeTicker(fromTickerRaw);
  const toTicker = normalizeTicker(toTickerRaw);
  if (!fromTicker || !toTicker || fromTicker === toTicker) return 1;

  const cachedDirect = getCachedFxRate(fromTicker, toTicker);
  if (Number.isFinite(cachedDirect) && cachedDirect > 0) {
    return cachedDirect;
  }

  try {
    const direct = await fetchYahooPriceBySymbol(`${fromTicker}${toTicker}=X`);
    const directRate = Number(direct?.precio);
    if (Number.isFinite(directRate) && directRate > 0) {
      setCachedFxRate(fromTicker, toTicker, directRate);
      setCachedFxRate(toTicker, fromTicker, 1 / directRate);
      return directRate;
    }
  } catch {
    // Intentar con par inverso.
  }

  try {
    const inverse = await fetchYahooPriceBySymbol(`${toTicker}${fromTicker}=X`);
    const inverseRate = Number(inverse?.precio);
    if (Number.isFinite(inverseRate) && inverseRate > 0) {
      const rate = 1 / inverseRate;
      setCachedFxRate(fromTicker, toTicker, rate);
      setCachedFxRate(toTicker, fromTicker, inverseRate);
      return rate;
    }
  } catch {
    // Fallback.
  }

  return 1;
}

async function getMarketQuoteForTicker(tickerRaw, quoteCache) {
  const ticker = normalizeTicker(tickerRaw);
  if (!ticker) {
    return {
      precio: 0,
      moneda: null
    };
  }

  if (quoteCache.has(ticker)) {
    return quoteCache.get(ticker);
  }

  try {
    const quote = await fetchYahooQuoteBySymbol(ticker);
    const precio = Number(quote?.precio || 0);
    const normalized = {
      precio: Number.isFinite(precio) && precio > 0 ? precio : 0,
      moneda: normalizeTicker(quote?.moneda) || null
    };
    quoteCache.set(ticker, normalized);
    return normalized;
  } catch {
    try {
      const quote = await fetchYahooPriceBySymbol(ticker);
      const precio = Number(quote?.precio || 0);
      const normalized = {
        precio: Number.isFinite(precio) && precio > 0 ? precio : 0,
        moneda: null
      };
      quoteCache.set(ticker, normalized);
      return normalized;
    } catch {
      const fallback = {
        precio: 0,
        moneda: null
      };
      quoteCache.set(ticker, fallback);
      return fallback;
    }
  }
}

async function calcularValorPosicionConMercado(queryable, posicionId, quoteCache = new Map()) {
  const [rows] = await queryable.query(
    `SELECT p.id, p.cantidad, p.preciopromedio, a.ticker,
            mpo.ticker as portafolio_moneda_ticker
     FROM Posicion p
     LEFT JOIN Activo a ON p.activo_id = a.id
     LEFT JOIN Portafolio po ON p.portafolio_id = po.id
     LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
     WHERE p.id=?
     LIMIT 1`,
    [posicionId]
  );
  if (!rows.length) {
    throw new Error("Posicion no encontrada");
  }

  const posicion = rows[0];
  const cantidad = Number(posicion?.cantidad || 0);
  const precioPromedio = Number(posicion?.preciopromedio || 0);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return {
      cantidad: 0,
      valor: 0
    };
  }

  const ticker = normalizeTicker(posicion?.ticker);
  const monedaPortafolioTicker = normalizeTicker(posicion?.portafolio_moneda_ticker);
  let precioActual = precioPromedio;
  let monedaOrigenTicker = monedaPortafolioTicker;

  if (ticker) {
    const quote = await getMarketQuoteForTicker(ticker, quoteCache);
    const precioMercado = Number(quote?.precio || 0);
    if (Number.isFinite(precioMercado) && precioMercado > 0) {
      precioActual = precioMercado;
      monedaOrigenTicker = normalizeTicker(quote?.moneda) || monedaPortafolioTicker;
    }
  }

  const fxRate = await getFxRate(monedaOrigenTicker, monedaPortafolioTicker);
  const precioConvertido =
    Math.max(0, Number(precioActual || 0)) * (Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1);
  return {
    cantidad,
    valor: Math.max(0, cantidad * precioConvertido)
  };
}

function toSqlDateTime(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function normalizeSnapshotFecha(fecha) {
  if (!fecha) return toSqlDateTime();
  const raw = String(fecha).trim();
  if (!raw) return toSqlDateTime();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
  return raw.replace("T", " ").slice(0, 19);
}

export const getAllPosicionSnapshots = () => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.cantidad * ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.cantidad * ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  ORDER BY ps.fecha DESC, ps.posicion_id
`);

export const getPosicionSnapshotById = (id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.id=?
`, [id]);

export const getSnapshotsByPosicion = (posicion_id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.posicion_id=?
  ORDER BY ps.fecha DESC
`, [posicion_id]);

export const getSnapshotsByPortafolio = (portafolio_id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE p.portafolio_id=?
  ORDER BY ps.fecha DESC, p.activo_id
`, [portafolio_id]);

export const getSnapshotsByUsuario = (usuario_id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
  ORDER BY ps.fecha DESC, p.portafolio_id, p.activo_id
`, [usuario_id]);

export const getSnapshotsByActivo = (activo_id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE p.activo_id=?
  ORDER BY ps.fecha DESC, p.portafolio_id
`, [activo_id]);

export const getSnapshotsByPosicionPeriodo = (posicion_id, fecha_inicio, fecha_fin) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.posicion_id=?
    AND ps.fecha >= CONCAT(?, ' 00:00:00')
    AND ps.fecha < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
  ORDER BY ps.fecha ASC
`, [posicion_id, fecha_inicio, fecha_fin]);

export const getSnapshotsByPortafolioFecha = (portafolio_id, fecha) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE p.portafolio_id=? AND DATE(ps.fecha)=?
  ORDER BY p.activo_id
`, [portafolio_id, fecha]);

export const getUltimoSnapshotByPosicion = (posicion_id) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.posicion_id=?
  ORDER BY ps.fecha DESC
  LIMIT 1
`, [posicion_id]);

export const getSnapshotsByFecha = (fecha) => pool.query(`
  SELECT ps.*, 
         p.portafolio_id, p.activo_id, p.cantidad as cantidad_actual, p.preciopromedio as precio_promedio_actual,
         po.nombre as portafolio_nombre, po.usuario_id,
         a.nombre as activo_nombre, a.ticker, a.icono as activo_icono,
         u.nombre as usuario_nombre,
         (ps.valor / NULLIF(ps.cantidad, 0)) as precio_promedio_snapshot,
         (ps.valor / NULLIF(ps.cantidad, 0)) * ps.cantidad as valor_calculado
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  LEFT JOIN Activo a ON p.activo_id = a.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE DATE(ps.fecha)=?
  ORDER BY p.portafolio_id, p.activo_id
`, [fecha]);

export const createPosicionSnapshot = ({ 
  posicion_id, 
  fecha = null,
  valor, 
  cantidad 
}) => pool.query(
  "INSERT INTO PosicionSnapshot(posicion_id, fecha, valor, cantidad) VALUES(?,?,?,?)",
  [posicion_id, normalizeSnapshotFecha(fecha), valor, cantidad]
);

export const createMultiplePosicionSnapshots = (snapshots) => {
  const values = snapshots.map(s => [s.posicion_id, s.fecha, s.valor, s.cantidad]);
  return pool.query(
    "INSERT INTO PosicionSnapshot(posicion_id, fecha, valor, cantidad) VALUES ?",
    [values]
  );
};

export const updatePosicionSnapshot = (id, { 
  posicion_id, 
  fecha, 
  valor, 
  cantidad 
}) => pool.query(
  "UPDATE PosicionSnapshot SET posicion_id=?, fecha=?, valor=?, cantidad=? WHERE id=?",
  [posicion_id, fecha, valor, cantidad, id]
);

export const deletePosicionSnapshot = (id) => pool.query(
  "DELETE FROM PosicionSnapshot WHERE id=?",
  [id]
);

export const deleteSnapshotsByPosicion = (posicion_id) => pool.query(
  "DELETE FROM PosicionSnapshot WHERE posicion_id=?",
  [posicion_id]
);

export const generarSnapshotPosicion = async (posicion_id, fecha = null) => {
  const snapshotFecha = normalizeSnapshotFecha(fecha);
  const valuation = await calcularValorPosicionConMercado(pool, posicion_id);

  if (Number(valuation?.cantidad || 0) <= 0) {
    return {
      id: null,
      posicion_id,
      fecha: snapshotFecha,
      valor: 0,
      cantidad: 0,
      actualizado: false,
      omitido: true
    };
  }

  const [result] = await pool.query(
    "INSERT INTO PosicionSnapshot(posicion_id, fecha, valor, cantidad) VALUES(?,?,?,?)",
    [posicion_id, snapshotFecha, valuation.valor, valuation.cantidad]
  );

  return {
    id: result.insertId,
    posicion_id,
    fecha: snapshotFecha,
    valor: valuation.valor,
    cantidad: valuation.cantidad,
    actualizado: false
  };
};

export const generarSnapshotsTodasPosicionesPortafolio = async (portafolio_id, fecha = null) => {
  const snapshotFecha = normalizeSnapshotFecha(fecha);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [posiciones] = await connection.query(
      "SELECT id FROM Posicion WHERE portafolio_id=? AND cantidad > 0",
      [portafolio_id]
    );

    const snapshots = [];
    const quoteCache = new Map();
    for (const posicion of posiciones) {
      const snapshot = await generarSnapshotPosicionTransaccional(
        connection,
        posicion.id,
        snapshotFecha,
        quoteCache
      );
      if (!snapshot?.omitido) {
        snapshots.push(snapshot);
      }
    }

    await connection.commit();
    return snapshots;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

async function generarSnapshotPosicionTransaccional(
  connection,
  posicion_id,
  fecha,
  quoteCache = new Map()
) {
  const valuation = await calcularValorPosicionConMercado(connection, posicion_id, quoteCache);
  if (Number(valuation?.cantidad || 0) <= 0) {
    return {
      id: null,
      posicion_id,
      fecha,
      valor: 0,
      cantidad: 0,
      actualizado: false,
      omitido: true
    };
  }

  const [result] = await connection.query(
    "INSERT INTO PosicionSnapshot(posicion_id, fecha, valor, cantidad) VALUES(?,?,?,?)",
    [posicion_id, fecha, valuation.valor, valuation.cantidad]
  );

  return {
    id: result.insertId,
    posicion_id,
    fecha,
    valor: valuation.valor,
    cantidad: valuation.cantidad,
    actualizado: false
  };
}

export const getEstadisticasPosicion = (posicion_id) => pool.query(`
  SELECT 
    MIN(valor) as valor_minimo,
    MAX(valor) as valor_maximo,
    AVG(valor) as valor_promedio,
    MIN(cantidad) as cantidad_minima,
    MAX(cantidad) as cantidad_maxima,
    AVG(cantidad) as cantidad_promedio,
    COUNT(*) as total_snapshots,
    MIN(fecha) as primera_fecha,
    MAX(fecha) as ultima_fecha,
    (MAX(valor) - MIN(valor)) as variacion_absoluta_valor,
    ROUND(((MAX(valor) - MIN(valor)) / NULLIF(MIN(valor), 0) * 100), 2) as variacion_porcentual_valor
  FROM PosicionSnapshot
  WHERE posicion_id=?
`, [posicion_id]);

export const getResumenPortafolioFecha = (portafolio_id, fecha) => pool.query(`
  SELECT 
    p.portafolio_id,
    po.nombre as portafolio_nombre,
    COUNT(ps.id) as total_posiciones_snapshot,
    SUM(ps.valor) as valor_total,
    SUM(ps.cantidad) as cantidad_total
  FROM PosicionSnapshot ps
  LEFT JOIN Posicion p ON ps.posicion_id = p.id
  LEFT JOIN Portafolio po ON p.portafolio_id = po.id
  WHERE p.portafolio_id=? AND DATE(ps.fecha)=?
  GROUP BY p.portafolio_id
`, [portafolio_id, fecha]);

