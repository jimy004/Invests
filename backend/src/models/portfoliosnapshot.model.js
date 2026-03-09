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

async function calcularValorPortafolioConMercado(queryable, portafolioId, tickerPriceCache = new Map()) {
  const [rows] = await queryable.query(
    `SELECT p.cantidad, p.preciopromedio, a.ticker, mpo.ticker as portafolio_moneda_ticker
     FROM Posicion p
     LEFT JOIN Activo a ON p.activo_id = a.id
     LEFT JOIN Portafolio po ON p.portafolio_id = po.id
     LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
     WHERE p.portafolio_id=?`,
    [portafolioId]
  );

  let total = 0;
  for (const row of rows) {
    const cantidad = Number(row?.cantidad || 0);
    const precioPromedio = Number(row?.preciopromedio || 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const ticker = normalizeTicker(row?.ticker);
    const monedaPortafolioTicker = normalizeTicker(row?.portafolio_moneda_ticker);
    let precioActual = precioPromedio;
    let monedaOrigenTicker = monedaPortafolioTicker;

    if (ticker) {
      if (!tickerPriceCache.has(ticker)) {
        try {
          const quote = await getMarketQuoteForTicker(ticker, tickerPriceCache);
          tickerPriceCache.set(ticker, quote);
        } catch {
          tickerPriceCache.set(ticker, {
            precio: Number.isFinite(precioPromedio) && precioPromedio > 0 ? precioPromedio : 0,
            moneda: monedaPortafolioTicker || null
          });
        }
      }
      const cached = tickerPriceCache.get(ticker);
      const cachedPrecio = Number(cached?.precio || 0);
      if (Number.isFinite(cachedPrecio) && cachedPrecio > 0) {
        precioActual = cachedPrecio;
        monedaOrigenTicker = normalizeTicker(cached?.moneda) || monedaPortafolioTicker;
      }
    }

    const fxRate = await getFxRate(monedaOrigenTicker, monedaPortafolioTicker);
    const precioConvertido = Math.max(0, Number(precioActual || 0)) * (Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1);
    total += cantidad * precioConvertido;
  }

  return Math.max(0, total);
}

export const getAllPortfolioSnapshots = () => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  ORDER BY ps.fecha DESC, ps.portafolio_id
`);

export const getPortfolioSnapshotById = (id) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.id=?
`, [id]);

export const getSnapshotsByPortafolio = (portafolio_id) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.portafolio_id=?
  ORDER BY ps.fecha DESC
`, [portafolio_id]);

export const getSnapshotsByUsuario = (usuario_id) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
  ORDER BY ps.fecha DESC, ps.portafolio_id
`, [usuario_id]);

export const getSnapshotsByPortafolioPeriodo = (portafolio_id, fecha_inicio, fecha_fin) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.portafolio_id=?
    AND ps.fecha >= CONCAT(?, ' 00:00:00')
    AND ps.fecha < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
  ORDER BY ps.fecha ASC
`, [portafolio_id, fecha_inicio, fecha_fin]);

export const getSnapshotsByUsuarioPeriodo = (usuario_id, fecha_inicio, fecha_fin) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=?
    AND ps.fecha >= CONCAT(?, ' 00:00:00')
    AND ps.fecha < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
  ORDER BY ps.fecha ASC, ps.portafolio_id
`, [usuario_id, fecha_inicio, fecha_fin]);

export const getUltimoSnapshotByPortafolio = (portafolio_id) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE ps.portafolio_id=?
  ORDER BY ps.fecha DESC
  LIMIT 1
`, [portafolio_id]);

export const getUltimoSnapshotByUsuario = (usuario_id) => pool.query(`
  SELECT 
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    COUNT(DISTINCT ps.portafolio_id) as total_portafolios,
    SUM(ps.valor) as valor_total,
    MAX(ps.fecha) as ultima_fecha
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE po.usuario_id=? AND ps.fecha = (
    SELECT MAX(fecha) 
    FROM PortfolioSnapshot ps2 
    LEFT JOIN Portafolio po2 ON ps2.portafolio_id = po2.id 
    WHERE po2.usuario_id=?
  )
  GROUP BY u.id
`, [usuario_id, usuario_id]);

export const getSnapshotsByFecha = (fecha) => pool.query(`
  SELECT ps.*, 
         po.nombre as portafolio_nombre, po.usuario_id,
         u.nombre as usuario_nombre
  FROM PortfolioSnapshot ps
  LEFT JOIN Portafolio po ON ps.portafolio_id = po.id
  LEFT JOIN Usuario u ON po.usuario_id = u.id
  WHERE DATE(ps.fecha)=?
  ORDER BY ps.portafolio_id
`, [fecha]);

export const createPortfolioSnapshot = ({ 
  portafolio_id, 
  fecha = null,
  valor 
}) => pool.query(
  "INSERT INTO PortfolioSnapshot(portafolio_id, fecha, valor) VALUES(?,?,?)",
  [portafolio_id, normalizeSnapshotFecha(fecha), valor]
);

export const createMultiplePortfolioSnapshots = (snapshots) => {
  const values = snapshots.map(s => [s.portafolio_id, s.fecha, s.valor]);
  return pool.query(
    "INSERT INTO PortfolioSnapshot(portafolio_id, fecha, valor) VALUES ?",
    [values]
  );
};

export const updatePortfolioSnapshot = (id, { 
  portafolio_id, 
  fecha, 
  valor 
}) => pool.query(
  "UPDATE PortfolioSnapshot SET portafolio_id=?, fecha=?, valor=? WHERE id=?",
  [portafolio_id, fecha, valor, id]
);

export const deletePortfolioSnapshot = (id) => pool.query(
  "DELETE FROM PortfolioSnapshot WHERE id=?",
  [id]
);

export const deleteSnapshotsByPortafolio = (portafolio_id) => pool.query(
  "DELETE FROM PortfolioSnapshot WHERE portafolio_id=?",
  [portafolio_id]
);

export const generarSnapshotPortafolio = async (portafolio_id, fecha = null) => {
  const snapshotFecha = normalizeSnapshotFecha(fecha);

  const [portafolio] = await pool.query("SELECT id FROM Portafolio WHERE id=?", [portafolio_id]);
  if (!portafolio.length) {
    throw new Error('Portafolio no encontrado');
  }

  const valor = await calcularValorPortafolioConMercado(pool, portafolio_id);
  
  // Crear el snapshot
  const [snapshotResult] = await pool.query(
    "INSERT INTO PortfolioSnapshot(portafolio_id, fecha, valor) VALUES(?,?,?)",
    [portafolio_id, snapshotFecha, valor]
  );
  
  return {
    id: snapshotResult.insertId,
    portafolio_id,
    fecha: snapshotFecha,
    valor
  };
};

export const generarSnapshotsTodosPortafolios = async (fecha = null) => {
  const snapshotFecha = normalizeSnapshotFecha(fecha);
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener todos los portafolios
    const [portafolios] = await connection.query("SELECT id FROM Portafolio");
    
    const snapshots = [];
    const tickerPriceCache = new Map();
    
    for (const portafolio of portafolios) {
      const valor = await calcularValorPortafolioConMercado(
        connection,
        portafolio.id,
        tickerPriceCache
      );
      
      // Crear el snapshot
      const [snapshotResult] = await connection.query(
        "INSERT INTO PortfolioSnapshot(portafolio_id, fecha, valor) VALUES(?,?,?)",
        [portafolio.id, snapshotFecha, valor]
      );
      
      snapshots.push({
        id: snapshotResult.insertId,
        portafolio_id: portafolio.id,
        fecha: snapshotFecha,
        valor
      });
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

export const getEstadisticasPortafolio = (portafolio_id) => pool.query(`
  SELECT 
    MIN(valor) as valor_minimo,
    MAX(valor) as valor_maximo,
    AVG(valor) as valor_promedio,
    COUNT(*) as total_snapshots,
    MIN(fecha) as primera_fecha,
    MAX(fecha) as ultima_fecha,
    (MAX(valor) - MIN(valor)) as variacion_absoluta,
    ROUND(((MAX(valor) - MIN(valor)) / MIN(valor) * 100), 2) as variacion_porcentual
  FROM PortfolioSnapshot
  WHERE portafolio_id=?
`, [portafolio_id]);
