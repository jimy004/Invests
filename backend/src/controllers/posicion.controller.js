import * as Posicion from "../models/posicion.model.js";
import { fetchYahooPriceBySymbol, fetchYahooQuoteBySymbol } from "../services/yahoo.service.js";

const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_MS || 5 * 60 * 1000);
const fxRateCache = new Map();

function shouldIncludeMarketData(value) {
  return String(value || "").toLowerCase() === "true";
}

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

  if (!fromTicker || !toTicker || fromTicker === toTicker) {
    return 1;
  }

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
    // Intentar par inverso.
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
    // Fallback a 1 si Yahoo no responde.
  }

  return 1;
}

async function enrichPosicionWithMarketData(posicion, tickerQuoteCache) {
  const ticker = normalizeTicker(posicion?.ticker);
  const precioPromedio = Number(posicion?.preciopromedio || 0);

  let precioActualOrigen = precioPromedio;
  let variacionDiaria = null;
  let monedaOrigenTicker = null;
  let capitalizacion = null;
  let volumen = null;
  let moneda = null;
  let mercado = null;
  if (ticker) {
    if (!tickerQuoteCache.has(ticker)) {
      try {
        const quote = await fetchYahooQuoteBySymbol(ticker);
        tickerQuoteCache.set(ticker, quote || null);
      } catch {
        tickerQuoteCache.set(ticker, null);
      }
    }
    const quote = tickerQuoteCache.get(ticker);
    const cachedPrice = Number(quote?.precio || 0);
    const cachedVariacion = Number(quote?.variacion_porcentual);
    const cachedCap = Number(quote?.capitalizacion);
    const cachedVol = Number(quote?.volumen);
    precioActualOrigen = Number.isFinite(cachedPrice) && cachedPrice > 0 ? cachedPrice : precioPromedio;
    variacionDiaria = Number.isFinite(cachedVariacion) ? cachedVariacion : null;
    capitalizacion = Number.isFinite(cachedCap) && cachedCap > 0 ? cachedCap : null;
    volumen = Number.isFinite(cachedVol) && cachedVol > 0 ? cachedVol : null;
    moneda = quote?.moneda ? String(quote.moneda) : null;
    mercado = quote?.mercado ? String(quote.mercado) : null;
    monedaOrigenTicker = normalizeTicker(moneda) || null;
  }

  const monedaPortafolioTicker = normalizeTicker(posicion?.portafolio_moneda_ticker) || monedaOrigenTicker;
  const fxRateRaw = await getFxRate(monedaOrigenTicker || monedaPortafolioTicker, monedaPortafolioTicker);
  const fxRate = Number.isFinite(fxRateRaw) && fxRateRaw > 0 ? fxRateRaw : 1;
  const precioActualConvertido = Math.max(0, Number(precioActualOrigen || 0) * fxRate);

  const cantidad = Number(posicion?.cantidad || 0);
  const valorTotalOrigen = Math.max(0, cantidad * Math.max(0, precioActualOrigen));
  const valorTotalConvertido = Math.max(0, cantidad * precioActualConvertido);
  const rentabilidad =
    precioPromedio > 0
      ? ((precioActualConvertido - precioPromedio) / precioPromedio) * 100
      : 0;

  return {
    ...posicion,
    precio_actual_origen: precioActualOrigen,
    precio_actual: precioActualConvertido,
    precio_actual_convertido: precioActualConvertido,
    precio_actual_origen_ticker: monedaOrigenTicker || monedaPortafolioTicker || null,
    precio_actual_moneda_ticker: monedaPortafolioTicker || monedaOrigenTicker || null,
    conversion_rate: fxRate,
    variacion_diaria: variacionDiaria,
    capitalizacion,
    volumen,
    moneda,
    mercado,
    rentabilidad,
    valor_total_origen: valorTotalOrigen,
    valor_total: valorTotalConvertido
  };
}

async function enrichPosicionesWithMarketData(rows) {
  const cache = new Map();
  return Promise.all((Array.isArray(rows) ? rows : []).map((row) => enrichPosicionWithMarketData(row, cache)));
}

function buildResumenFromPosiciones(rows, base = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const totalPosiciones = list.length;
  const cantidadTotal = list.reduce((sum, item) => sum + Number(item?.cantidad || 0), 0);
  const valorTotal = list.reduce((sum, item) => sum + Number(item?.valor_total || 0), 0);
  const precioPromedioPromedio =
    totalPosiciones > 0
      ? list.reduce((sum, item) => sum + Number(item?.precio_actual || item?.preciopromedio || 0), 0) /
        totalPosiciones
      : 0;

  return {
    ...base,
    total_posiciones: totalPosiciones,
    cantidad_total: cantidadTotal,
    valor_total: valorTotal,
    precio_promedio_promedio: precioPromedioPromedio
  };
}

export const getAll = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByUsuario(req.authUserId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByPortafolio = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByPortafolio(req.params.portafolio_id);
    if (!shouldIncludeMarketData(req.query.include_market_data)) {
      return res.json(rows);
    }
    const enriched = await enrichPosicionesWithMarketData(rows);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByUsuario(req.params.usuario_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByActivo = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByActivoUsuario(req.params.activo_id, req.authUserId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenByPortafolio = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByPortafolio(req.params.portafolio_id);
    const enriched = await enrichPosicionesWithMarketData(rows);
    const nombrePortafolio = enriched[0]?.portafolio_nombre || null;
    res.json(
      buildResumenFromPosiciones(enriched, {
        portafolio_id: Number(req.params.portafolio_id),
        portafolio_nombre: nombrePortafolio
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenByUsuario = async (req, res) => {
  try {
    const [rows] = await Posicion.getPosicionesByUsuario(req.params.usuario_id);
    const enriched = await enrichPosicionesWithMarketData(rows);
    const nombreUsuario = enriched[0]?.usuario_nombre || null;
    res.json(
      buildResumenFromPosiciones(enriched, {
        usuario_id: Number(req.params.usuario_id),
        usuario_nombre: nombreUsuario,
        total_portafolios: new Set(enriched.map((row) => Number(row.portafolio_id))).size,
        valor_total_invertido: enriched.reduce((sum, item) => sum + Number(item?.valor_total || 0), 0),
        cantidad_total_activos: enriched.reduce((sum, item) => sum + Number(item?.cantidad || 0), 0)
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { portafolio_id, activo_id, cantidad = 0, preciopromedio = 0 } = req.body;
    
    // Validaciones
    if (!portafolio_id || !activo_id) {
      return res.status(400).json({ 
        message: "portafolio_id y activo_id son requeridos" 
      });
    }
    
    if (cantidad < 0 || preciopromedio < 0) {
      return res.status(400).json({ 
        message: "cantidad y preciopromedio deben ser números positivos" 
      });
    }
    
    // Verificar si ya existe una posición para este activo en el portafolio
    const [posicionExistente] = await Posicion.buscarPosicionPorPortafolioActivo(portafolio_id, activo_id);
    if (posicionExistente.length > 0) {
      return res.status(400).json({ 
        message: "Ya existe una posición para este activo en el portafolio",
        posicion_existente: posicionExistente[0]
      });
    }
    
    const [result] = await Posicion.createPosicion({ 
      portafolio_id, 
      activo_id, 
      cantidad, 
      preciopromedio 
    });
    
    // Obtener la posición creada
    const [posicionCreada] = await Posicion.getPosicionById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...posicionCreada[0],
      message: "Posición creada exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El portafolio o activo especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Posicion.updatePosicion(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    
    // Obtener la posición actualizada
    const [posicionActualizada] = await Posicion.getPosicionById(req.params.id);
    
    res.json({
      ...posicionActualizada[0],
      message: "Posición actualizada"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El portafolio o activo especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateCantidad = async (req, res) => {
  try {
    const { cantidad } = req.body;
    
    if (cantidad === undefined || cantidad < 0) {
      return res.status(400).json({ 
        message: "La cantidad es requerida y debe ser positiva" 
      });
    }
    
    const [result] = await Posicion.updatePosicionCantidad(req.params.id, cantidad);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    
    res.json({ 
      message: "Cantidad actualizada",
      cantidad 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePrecio = async (req, res) => {
  try {
    const { preciopromedio } = req.body;
    
    if (preciopromedio === undefined || preciopromedio < 0) {
      return res.status(400).json({ 
        message: "El precio promedio es requerido y debe ser positivo" 
      });
    }
    
    const [result] = await Posicion.updatePosicionPrecio(req.params.id, preciopromedio);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    
    res.json({ 
      message: "Precio promedio actualizado",
      preciopromedio 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const incrementar = async (req, res) => {
  try {
    const { cantidad_incremento, precio_compra } = req.body;
    
    if (cantidad_incremento === undefined || cantidad_incremento <= 0 || 
        precio_compra === undefined || precio_compra <= 0) {
      return res.status(400).json({ 
        message: "cantidad_incremento y precio_compra son requeridos y deben ser positivos" 
      });
    }
    
    const [result] = await Posicion.incrementarPosicion(
      req.params.id, 
      parseFloat(cantidad_incremento), 
      parseFloat(precio_compra)
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    
    // Obtener la posición actualizada
    const [posicionActualizada] = await Posicion.getPosicionById(req.params.id);
    
    res.json({
      ...posicionActualizada[0],
      message: "Posición incrementada exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const decrementar = async (req, res) => {
  try {
    const { cantidad_decremento } = req.body;
    
    if (cantidad_decremento === undefined || cantidad_decremento <= 0) {
      return res.status(400).json({ 
        message: "cantidad_decremento es requerido y debe ser positivo" 
      });
    }
    
    const [result] = await Posicion.decrementarPosicion(
      req.params.id, 
      parseFloat(cantidad_decremento)
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        message: "No se pudo decrementar: cantidad insuficiente o posición no encontrada" 
      });
    }
    
    // Obtener la posición actualizada
    const [posicionActualizada] = await Posicion.getPosicionById(req.params.id);
    
    // Si la cantidad llegó a cero, eliminar la posición
    if (posicionActualizada[0].cantidad === 0) {
      await Posicion.deletePosicion(req.params.id);
      return res.json({ 
        message: "Posición decrementada y eliminada (cantidad llegó a cero)" 
      });
    }
    
    res.json({
      ...posicionActualizada[0],
      message: "Posición decrementada exitosamente"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Posicion.deletePosicion(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Posición eliminada" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar la posición porque tiene órdenes asociadas" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};
