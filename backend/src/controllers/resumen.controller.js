import * as Resumen from "../models/resumen.model.js";
import * as CashFlow from "../models/cashflow.model.js";
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
    // Intentar via par inverso.
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
    // Fallback a 1 para no romper el resumen si Yahoo no responde.
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

export const getAll = async (req, res) => {
  try {
    const [rows] = await Resumen.getAllResumenes();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Resumen.getResumenById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.params.usuario_id);
    const [liquidezCategoriaRows] = await Resumen.getCategoriaByNombre("Liquidez");
    const liquidezCategoriaId = Number(liquidezCategoriaRows?.[0]?.id || 0);
    if (liquidezCategoriaId) {
      await Resumen.ensureResumenByUsuarioCategoria(usuarioId, liquidezCategoriaId);
    }

    const [rows] = await Resumen.getResumenByUsuarioConTotalesPorMoneda(req.params.usuario_id);
    if (!rows.length) {
      return res.json([]);
    }

    const targetTicker = normalizeTicker(rows[0]?.moneda_ticker);
    const aggregated = new Map();
    const assetQuoteCache = new Map();
    const [inversionRows] = await Resumen.getInversionInicialByUsuarioConTotalesPorMoneda(
      req.params.usuario_id
    );
    const [cashFlowRows] = await CashFlow.getCashFlowsByUsuario(usuarioId);
    let saldoLiquidez = 0;
    for (const movement of cashFlowRows) {
      const amount = Number(movement?.aporte || 0);
      if (!Number.isFinite(amount) || amount === 0) continue;
      const sourceTicker = normalizeTicker(movement?.moneda_ticker) || targetTicker;
      const rate = await getFxRate(sourceTicker, targetTicker);
      const signedAmount =
        String(movement?.tipo || "").toLowerCase() === "gasto" ? -amount : amount;
      saldoLiquidez += signedAmount * rate;
    }
    const inversionInicialByResumen = new Map();

    for (const invRow of inversionRows) {
      const resumenId = Number(invRow?.resumen_id || 0);
      if (!resumenId) continue;
      const inversionOrigen = Number(invRow?.inversionInicialOrigen || 0);
      if (!Number.isFinite(inversionOrigen) || inversionOrigen === 0) continue;
      const sourceTicker = normalizeTicker(invRow?.moneda_origen_ticker) || targetTicker;
      const rate = await getFxRate(sourceTicker, targetTicker);
      const current = Number(inversionInicialByResumen.get(resumenId) || 0);
      inversionInicialByResumen.set(resumenId, current + inversionOrigen * rate);
    }

    for (const row of rows) {
      const resumenId = Number(row.id);
      if (!aggregated.has(resumenId)) {
        aggregated.set(resumenId, {
          ...row,
          totalCategoriaMoneda: 0
        });
      }

      const cantidad = Number(row.cantidadTotalActivo || 0);
      const inversionPromedio = Number(row.inversionTotalPromedioOrigen || 0);
      const activoTicker = normalizeTicker(row.activo_ticker);
      if (!Number.isFinite(cantidad) || cantidad === 0) {
        continue;
      }

      const quote = await getMarketQuoteForTicker(activoTicker, assetQuoteCache);
      const precioActual = Number(quote?.precio || 0);
      const totalOrigen = precioActual > 0 ? cantidad * precioActual : inversionPromedio;
      if (!Number.isFinite(totalOrigen) || totalOrigen === 0) {
        continue;
      }

      const sourceTicker =
        precioActual > 0
          ? normalizeTicker(quote?.moneda) ||
            normalizeTicker(row.moneda_origen_ticker) ||
            targetTicker
          : normalizeTicker(row.moneda_origen_ticker) || targetTicker;
      const rate = await getFxRate(sourceTicker, targetTicker);
      const current = aggregated.get(resumenId);
      current.totalCategoriaMoneda = Number(current.totalCategoriaMoneda || 0) + totalOrigen * rate;
    }

    const payload = Array.from(aggregated.values()).map((item) => ({
      ...item,
      inversionInicial:
        Number(item.categoria_id || 0) === liquidezCategoriaId
          ? saldoLiquidez
          : Number(inversionInicialByResumen.get(Number(item.id)) || 0),
      totalCategoriaMoneda:
        Number(item.categoria_id || 0) === liquidezCategoriaId
          ? saldoLiquidez
          : Number(item.totalCategoriaMoneda || 0),
      moneda_ticker: targetTicker || item.moneda_ticker || null
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuarioCategoria = async (req, res) => {
  try {
    const { usuario_id, categoria_id } = req.params;
    const [rows] = await Resumen.getResumenByUsuarioCategoria(usuario_id, categoria_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAgregadoUsuario = async (req, res) => {
  try {
    const [rows] = await Resumen.getResumenAgregadoUsuario(req.params.usuario_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontró resumen para este usuario" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, pesoObjetivo = 0, inversionInicial = 0, categoria_id } = req.body;
    
    if (!usuario_id) {
      return res.status(400).json({ 
        message: "El usuario es requerido" 
      });
    }
    
    // Verificar si ya existe un resumen para este usuario y categoría
    if (categoria_id) {
      const [existente] = await Resumen.getResumenByUsuarioCategoria(usuario_id, categoria_id);
      if (existente.length > 0) {
        return res.status(400).json({ 
          message: "Ya existe un resumen para este usuario y categoría" 
        });
      }
    }
    
    const [result] = await Resumen.createResumen({ 
      usuario_id, 
      pesoObjetivo, 
      inversionInicial, 
      categoria_id 
    });
    
    // Obtener el resumen creado con relaciones
    const [resumenCreado] = await Resumen.getResumenById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...resumenCreado[0],
      message: "Resumen creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario o categoría especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Resumen.updateResumen(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el resumen actualizado
    const [resumenActualizado] = await Resumen.getResumenById(req.params.id);
    
    res.json({
      ...resumenActualizado[0],
      message: "Resumen actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario o categoría especificados no existen" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updatePeso = async (req, res) => {
  try {
    const { pesoObjetivo } = req.body;
    
    if (pesoObjetivo === undefined) {
      return res.status(400).json({ 
        message: "El peso objetivo es requerido" 
      });
    }
    
    const [result] = await Resumen.updateResumenPeso(req.params.id, pesoObjetivo);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    res.json({ 
      message: "Peso objetivo actualizado",
      pesoObjetivo 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInversion = async (req, res) => {
  try {
    const { inversionInicial } = req.body;
    
    if (inversionInicial === undefined) {
      return res.status(400).json({ 
        message: "La inversión inicial es requerida" 
      });
    }
    
    const [result] = await Resumen.updateResumenInversion(req.params.id, inversionInicial);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    res.json({ 
      message: "Inversión inicial actualizada",
      inversionInicial 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Resumen.deleteResumen(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Resumen eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
