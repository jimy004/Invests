import * as CashFlow from "../models/cashflow.model.js";
import { fetchYahooPriceBySymbol } from "../services/yahoo.service.js";

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

async function enrichMovementsWithConversion(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const targetTicker = normalizeTicker(rows[0]?.moneda_usuario_ticker);

  const mapped = [];
  for (const row of rows) {
    const originalAmount = Number(row?.aporte || 0);
    const sourceTicker = normalizeTicker(row?.moneda_ticker) || targetTicker;
    const rate = await getFxRate(sourceTicker, targetTicker);
    const convertedAmount =
      Number.isFinite(originalAmount) && Number.isFinite(rate) ? originalAmount * rate : 0;

    mapped.push({
      ...row,
      aporte_original: originalAmount,
      moneda_origen_ticker: sourceTicker || null,
      aporte_convertido: convertedAmount,
      moneda_convertida_ticker: targetTicker || sourceTicker || null
    });
  }
  return mapped;
}

async function computeConvertedSaldoNeto(rows, targetTickerRaw) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const targetTicker = normalizeTicker(targetTickerRaw);
  let saldoNeto = 0;

  for (const row of rows) {
    const amount = Number(row?.aporte || 0);
    if (!Number.isFinite(amount) || amount === 0) continue;
    const sourceTicker = normalizeTicker(row?.moneda_ticker) || targetTicker;
    const rate = await getFxRate(sourceTicker, targetTicker);
    const signedAmount = String(row?.tipo || "").toLowerCase() === "gasto" ? -amount : amount;
    saldoNeto += signedAmount * rate;
  }

  return saldoNeto;
}

export const getAll = async (req, res) => {
  try {
    const [rows] = await CashFlow.getAllCashFlows();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await CashFlow.getCashFlowById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuario = async (req, res) => {
  try {
    const [rows] = await CashFlow.getCashFlowsByUsuario(req.params.usuario_id);
    const convertedRows = await enrichMovementsWithConversion(rows);
    res.json(convertedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuarioTipo = async (req, res) => {
  try {
    const { usuario_id, tipo } = req.params;
    
    // Validar que el tipo sea vÃ¡lido
    if (tipo !== 'ingreso' && tipo !== 'gasto') {
      return res.status(400).json({ 
        message: "Tipo debe ser 'ingreso' o 'gasto'" 
      });
    }
    
    const [rows] = await CashFlow.getCashFlowsByUsuarioTipo(usuario_id, tipo);
    const convertedRows = await enrichMovementsWithConversion(rows);
    res.json(convertedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByUsuarioPeriodo = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: "fecha_inicio y fecha_fin son requeridos" 
      });
    }
    
    const [rows] = await CashFlow.getCashFlowsByUsuarioPeriodo(usuario_id, fecha_inicio, fecha_fin);
    const convertedRows = await enrichMovementsWithConversion(rows);
    res.json(convertedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenUsuario = async (req, res) => {
  try {
    const [rows] = await CashFlow.getResumenCashFlowUsuario(req.params.usuario_id);
    if (!rows.length) return res.status(404).json({ message: "No se encontraron cash flows para este usuario" });
    const targetTicker = normalizeTicker(rows[0]?.moneda_usuario_ticker);
    const [movementRows] = await CashFlow.getCashFlowsByUsuario(req.params.usuario_id);
    const saldoNetoConvertido = await computeConvertedSaldoNeto(movementRows, targetTicker);
    res.json({
      ...rows[0],
      saldo_neto_original: Number(rows[0]?.saldo_neto || 0),
      saldo_neto: saldoNetoConvertido,
      moneda_ticker: targetTicker || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumenUsuarioPeriodo = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        message: "fecha_inicio y fecha_fin son requeridos" 
      });
    }
    
    const [rows] = await CashFlow.getResumenCashFlowUsuarioPeriodo(usuario_id, fecha_inicio, fecha_fin);
    if (!rows.length) {
      return res.status(404).json({ message: "No se encontraron cash flows para este usuario en el período" });
    }
    const targetTicker = normalizeTicker(rows[0]?.moneda_usuario_ticker);
    const [movementRows] = await CashFlow.getCashFlowsByUsuarioPeriodo(usuario_id, fecha_inicio, fecha_fin);
    const saldoNetoConvertido = await computeConvertedSaldoNeto(movementRows, targetTicker);

    res.json({
      ...rows[0],
      saldo_neto_original: Number(rows[0]?.saldo_neto || 0),
      saldo_neto: saldoNetoConvertido,
      moneda_ticker: targetTicker || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    // Validar que el tipo sea vÃ¡lido
    if (tipo !== 'ingreso' && tipo !== 'gasto') {
      return res.status(400).json({ 
        message: "Tipo debe ser 'ingreso' o 'gasto'" 
      });
    }
    
    const [rows] = await CashFlow.getCashFlowsByTipo(tipo);
    const convertedRows = await enrichMovementsWithConversion(rows);
    res.json(convertedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { usuario_id, tipo, categoria = "otros", moneda_id = null, nombre, fecha, aporte, observacion } = req.body;
    
    // Validaciones
    if (!usuario_id || !tipo || !nombre || !fecha || aporte === undefined) {
      return res.status(400).json({ 
        message: "usuario_id, tipo, nombre, fecha y aporte son requeridos" 
      });
    }
    
    if (tipo !== 'ingreso' && tipo !== 'gasto') {
      return res.status(400).json({ 
        message: "Tipo debe ser 'ingreso' o 'gasto'" 
      });
    }
    
    if (isNaN(aporte) || parseFloat(aporte) <= 0) {
      return res.status(400).json({ 
        message: "El aporte debe ser un nÃºmero positivo" 
      });
    }
    if (!String(categoria || "").trim()) {
      return res.status(400).json({
        message: "La categoria es requerida"
      });
    }
    const monedaIdNormalizada =
      moneda_id === null || moneda_id === undefined || moneda_id === ""
        ? null
        : Number(moneda_id);
    if (monedaIdNormalizada !== null && (!Number.isInteger(monedaIdNormalizada) || monedaIdNormalizada <= 0)) {
      return res.status(400).json({
        message: "La moneda es invalida"
      });
    }

    const [result] = await CashFlow.createCashFlow({ 
      usuario_id, 
      tipo, 
      categoria: String(categoria).trim() || "otros",
      moneda_id: monedaIdNormalizada,
      nombre, 
      fecha, 
      aporte, 
      observacion 
    });
    
    // Obtener el cash flow creado
    const [cashFlowCreado] = await CashFlow.getCashFlowById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...cashFlowCreado[0],
      message: "Cash flow creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario especificado no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { tipo, categoria, moneda_id } = req.body;
    
    // Validar tipo si estÃ¡ presente
    if (tipo && tipo !== 'ingreso' && tipo !== 'gasto') {
      return res.status(400).json({ 
        message: "Tipo debe ser 'ingreso' o 'gasto'" 
      });
    }
    if (categoria !== undefined && !String(categoria || "").trim()) {
      return res.status(400).json({
        message: "La categoria es requerida"
      });
    }
    if (moneda_id !== undefined && moneda_id !== null && moneda_id !== "") {
      const monedaIdNormalizada = Number(moneda_id);
      if (!Number.isInteger(monedaIdNormalizada) || monedaIdNormalizada <= 0) {
        return res.status(400).json({
          message: "La moneda es invalida"
        });
      }
    }
    
    const payload = {
      ...req.body,
      moneda_id:
        moneda_id === undefined || moneda_id === null || moneda_id === ""
          ? null
          : Number(moneda_id)
    };

    const [result] = await CashFlow.updateCashFlow(req.params.id, payload);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el cash flow actualizado
    const [cashFlowActualizado] = await CashFlow.getCashFlowById(req.params.id);
    
    res.json({
      ...cashFlowActualizado[0],
      message: "Cash flow actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "El usuario especificado no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await CashFlow.deleteCashFlow(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Cash flow eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


