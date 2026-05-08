import pool from "../db.js";
import * as SnapshotConfig from "../models/snapshotconfig.model.js";
import * as Notificacion from "../models/notificacion.model.js";
import { fetchYahooPriceBySymbol, fetchYahooQuoteBySymbol } from "./yahoo.service.js";
import { getFxRate } from "./fx-cache.service.js";

const AUTO_SNAPSHOT_ENABLED =
  String(process.env.AUTO_SNAPSHOT_ENABLED ?? "true").toLowerCase() !== "false";
const AUTO_SNAPSHOT_TICK_MS = Number(process.env.AUTO_SNAPSHOT_TICK_MS || 60000);

let schedulerTimer = null;
let isRunning = false;

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
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

function toDateTimeString(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function isDue(lastRun, intervalMinutes) {
  if (!lastRun) return true;
  const now = Date.now();
  const last = new Date(lastRun).getTime();
  if (!Number.isFinite(last)) return true;
  return now - last >= intervalMinutes * 60 * 1000;
}

async function upsertPosicionSnapshot(posicionId, fecha, valor, cantidad) {
  const [rows] = await pool.query(
    `SELECT id
     FROM PosicionSnapshot
     WHERE posicion_id=? AND fecha=?
     ORDER BY id DESC
     LIMIT 1`,
    [posicionId, fecha]
  );

  if (rows.length > 0) {
    await pool.query(
      "UPDATE PosicionSnapshot SET valor=?, cantidad=? WHERE id=?",
      [valor, cantidad, rows[0].id]
    );
    return { id: rows[0].id, updated: true };
  }

  const [result] = await pool.query(
    "INSERT INTO PosicionSnapshot(posicion_id, fecha, valor, cantidad) VALUES(?,?,?,?)",
    [posicionId, fecha, valor, cantidad]
  );
  return { id: result.insertId, updated: false };
}

async function upsertPortfolioSnapshot(portafolioId, fecha, valor) {
  const [rows] = await pool.query(
    `SELECT id
     FROM PortfolioSnapshot
     WHERE portafolio_id=? AND fecha=?
     ORDER BY id DESC
     LIMIT 1`,
    [portafolioId, fecha]
  );

  if (rows.length > 0) {
    await pool.query("UPDATE PortfolioSnapshot SET valor=? WHERE id=?", [valor, rows[0].id]);
    return { id: rows[0].id, updated: true };
  }

  const [result] = await pool.query(
    "INSERT INTO PortfolioSnapshot(portafolio_id, fecha, valor) VALUES(?,?,?)",
    [portafolioId, fecha, valor]
  );
  return { id: result.insertId, updated: false };
}

async function getPortfolioValuationsByUsuario(usuarioId) {
  const [portafolios] = await pool.query("SELECT id FROM Portafolio WHERE usuario_id=?", [usuarioId]);
  const [posiciones] = await pool.query(
    `SELECT p.id AS posicion_id, p.portafolio_id, p.cantidad, p.preciopromedio, a.ticker,
            mpo.ticker AS portafolio_moneda_ticker
     FROM Posicion p
     INNER JOIN Portafolio po ON p.portafolio_id = po.id
     LEFT JOIN Activo a ON p.activo_id = a.id
     LEFT JOIN Moneda mpo ON po.moneda_id = mpo.id
     WHERE po.usuario_id=?`,
    [usuarioId]
  );

  const tickerQuoteCache = new Map();
  const positionValuations = [];
  const portfolioTotals = new Map(portafolios.map((p) => [p.id, 0]));

  for (const posicion of posiciones) {
    const cantidad = Number(posicion.cantidad || 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const ticker = normalizeTicker(posicion.ticker);
    const monedaPortafolioTicker = normalizeTicker(posicion?.portafolio_moneda_ticker);
    let precio = Number(posicion.preciopromedio || 0);
    let monedaOrigenTicker = monedaPortafolioTicker;

    if (ticker) {
      if (!tickerQuoteCache.has(ticker)) {
        try {
          const quote = await getMarketQuoteForTicker(ticker, tickerQuoteCache);
          tickerQuoteCache.set(ticker, quote);
        } catch {
          tickerQuoteCache.set(ticker, {
            precio: Number(posicion.preciopromedio || 0),
            moneda: monedaPortafolioTicker || null
          });
        }
      }
      const quote = tickerQuoteCache.get(ticker);
      const precioMercado = Number(quote?.precio || 0);
      if (Number.isFinite(precioMercado) && precioMercado > 0) {
        precio = precioMercado;
        monedaOrigenTicker = normalizeTicker(quote?.moneda) || monedaPortafolioTicker;
      }
    }

    const fxRate = await getFxRate(monedaOrigenTicker, monedaPortafolioTicker);
    const precioConvertido = Math.max(0, precio) * (Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1);
    const valor = Math.max(0, cantidad * precioConvertido);
    positionValuations.push({
      posicion_id: posicion.posicion_id,
      portafolio_id: posicion.portafolio_id,
      cantidad,
      valor
    });
    portfolioTotals.set(
      posicion.portafolio_id,
      Number(portfolioTotals.get(posicion.portafolio_id) || 0) + valor
    );
  }

  return {
    portfolioIds: portafolios.map((p) => p.id),
    positionValuations,
    portfolioTotals
  };
}

async function processUserConfig(configRow) {
  const usuarioId = Number(configRow.usuario_id);
  const duePosiciones = isDue(configRow.last_run_posicion, Number(configRow.interval_posicion_minutes));
  const duePortafolios = isDue(
    configRow.last_run_portafolio,
    Number(configRow.interval_portafolio_minutes)
  );

  if (!duePosiciones && !duePortafolios) {
    return;
  }

  const fecha = toDateTimeString();
  const valuation = await getPortfolioValuationsByUsuario(usuarioId);
  let processedPosiciones = 0;
  let processedPortafolios = 0;

  if (duePosiciones) {
    for (const pos of valuation.positionValuations) {
      await upsertPosicionSnapshot(pos.posicion_id, fecha, pos.valor, pos.cantidad);
      processedPosiciones += 1;
    }
    await SnapshotConfig.updateLastRunPosicion(usuarioId);
  }

  if (duePortafolios) {
    for (const portafolioId of valuation.portfolioIds) {
      const valor = Number(valuation.portfolioTotals.get(portafolioId) || 0);
      await upsertPortfolioSnapshot(portafolioId, fecha, valor);
      processedPortafolios += 1;
    }
    await SnapshotConfig.updateLastRunPortafolio(usuarioId);
  }

  if (duePosiciones || duePortafolios) {
    await Notificacion.createNotificacion({
      usuario_id: usuarioId,
      tipo: "snapshot_auto",
      mensaje: `Snapshots automaticos procesados (${fecha}): ${processedPortafolios} portafolios y ${processedPosiciones} posiciones.`
    });
  }
}

async function runSchedulerTick() {
  if (isRunning) return;
  isRunning = true;
  try {
    const [configs] = await SnapshotConfig.getEnabledSnapshotConfigs();
    for (const cfg of configs) {
      try {
        await processUserConfig(cfg);
      } catch (err) {
        console.error(
          `[snapshot-scheduler] Error procesando usuario ${cfg.usuario_id}:`,
          err?.message || err
        );
      }
    }
  } finally {
    isRunning = false;
  }
}

export function startSnapshotScheduler() {
  if (!AUTO_SNAPSHOT_ENABLED) {
    console.log("[snapshot-scheduler] Deshabilitado por AUTO_SNAPSHOT_ENABLED=false");
    return;
  }

  if (schedulerTimer) return;

  schedulerTimer = setInterval(() => {
    runSchedulerTick().catch((err) => {
      console.error("[snapshot-scheduler] Tick error:", err?.message || err);
    });
  }, Math.max(5000, AUTO_SNAPSHOT_TICK_MS));

  console.log(
    `[snapshot-scheduler] Iniciado. Tick cada ${Math.max(5000, AUTO_SNAPSHOT_TICK_MS)} ms`
  );

  runSchedulerTick().catch((err) => {
    console.error("[snapshot-scheduler] Error inicial:", err?.message || err);
  });
}
