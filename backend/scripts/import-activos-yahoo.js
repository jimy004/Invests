import pool from "../src/db.js";
import { fetchYahooAssetBySymbol } from "../src/services/yahoo.service.js";

const ASSETS_TO_IMPORT = [
  { symbol: "BTC-USD", categoria: "Criptomonedas" },
  { symbol: "ETH-USD", categoria: "Criptomonedas" },
  { symbol: "SOL-USD", categoria: "Criptomonedas" },
  { symbol: "AAPL", categoria: "Acciones" },
  { symbol: "MSFT", categoria: "Acciones" },
  { symbol: "NVDA", categoria: "Acciones" },
  { symbol: "AMZN", categoria: "Acciones" },
  { symbol: "GOOGL", categoria: "Acciones" },
  { symbol: "SPY", categoria: "ETFs" },
  { symbol: "QQQ", categoria: "ETFs" },
  { symbol: "VTI", categoria: "ETFs" },
  { symbol: "AGG", categoria: "Renta fija" },
  { symbol: "BND", categoria: "Renta fija" },
  { symbol: "TLT", categoria: "Renta fija" },
  { symbol: "BIL", categoria: "Liquidez" },
  { symbol: "SHV", categoria: "Liquidez" },
  { symbol: "VNQ", categoria: "Inmobiliario" },
  { symbol: "O", categoria: "Inmobiliario" },
  { symbol: "GLD", categoria: "Materias primas" },
  { symbol: "SLV", categoria: "Materias primas" },
  { symbol: "USO", categoria: "Materias primas" },
  { symbol: "VIXY", categoria: "Derivados" },
  { symbol: "UVXY", categoria: "Derivados" },
  { symbol: "BRK-B", categoria: "Otros" }
];

const REQUEST_DELAY_MS = Number(process.env.YAHOO_REQUEST_DELAY_MS || 1200);
const MAX_RETRIES = Number(process.env.YAHOO_MAX_RETRIES || 3);
const FALLBACK_WITH_SYMBOL = process.env.YAHOO_FALLBACK_WITH_SYMBOL !== "false";

const SYMBOL_NAME_FALLBACK = {
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  "SOL-USD": "Solana",
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  NVDA: "NVIDIA Corp.",
  AMZN: "Amazon.com Inc.",
  GOOGL: "Alphabet Inc.",
  SPY: "SPDR S&P 500 ETF Trust",
  QQQ: "Invesco QQQ Trust",
  VTI: "Vanguard Total Stock Market ETF",
  AGG: "iShares Core U.S. Aggregate Bond ETF",
  BND: "Vanguard Total Bond Market ETF",
  TLT: "iShares 20+ Year Treasury Bond ETF",
  BIL: "SPDR Bloomberg 1-3 Month T-Bill ETF",
  SHV: "iShares Short Treasury Bond ETF",
  VNQ: "Vanguard Real Estate ETF",
  O: "Realty Income Corp.",
  GLD: "SPDR Gold Shares",
  SLV: "iShares Silver Trust",
  USO: "United States Oil Fund",
  VIXY: "ProShares VIX Short-Term Futures ETF",
  UVXY: "ProShares Ultra VIX Short-Term Futures ETF",
  "BRK-B": "Berkshire Hathaway Inc. Class B"
};

const categoryIdCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("too many requests") || msg.includes("failed to get crumb");
}

async function fetchWithRetry(symbol) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fetchYahooAssetBySymbol(symbol);
    } catch (err) {
      lastError = err;
      if (!isRateLimitError(err) || attempt === MAX_RETRIES) break;
      const backoff = REQUEST_DELAY_MS * attempt;
      console.log(`WARN  ${symbol}: rate-limit intento ${attempt}/${MAX_RETRIES}, esperando ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError;
}

async function getCategoryIdByName(categoria) {
  if (categoryIdCache.has(categoria)) return categoryIdCache.get(categoria);
  const [rows] = await pool.query("SELECT id FROM Categoria WHERE categoria=? LIMIT 1", [categoria]);
  const id = rows.length ? rows[0].id : null;
  categoryIdCache.set(categoria, id);
  return id;
}

async function assetExistsByTicker(ticker) {
  const [rows] = await pool.query(
    "SELECT id, nombre, ticker FROM Activo WHERE UPPER(ticker)=UPPER(?) LIMIT 1",
    [ticker]
  );
  return rows.length ? rows[0] : null;
}

async function insertAsset({ categoria_id, nombre, ticker, icono = null }) {
  const [result] = await pool.query(
    "INSERT INTO Activo(categoria_id, nombre, ticker, icono) VALUES(?,?,?,?)",
    [categoria_id, nombre, ticker, icono]
  );
  return result.insertId;
}

async function run() {
  let created = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Importing ${ASSETS_TO_IMPORT.length} assets from Yahoo Finance...`);

  for (const item of ASSETS_TO_IMPORT) {
    const symbol = String(item.symbol || "").trim().toUpperCase();
    const categoria = item.categoria;

    if (!symbol || !categoria) {
      failed += 1;
      console.log(`FAIL  invalid input: symbol=${symbol} categoria=${categoria}`);
      continue;
    }

    try {
      await sleep(REQUEST_DELAY_MS);

      const categoriaId = await getCategoryIdByName(categoria);
      if (!categoriaId) {
        failed += 1;
        console.log(`FAIL  ${symbol}: categoria '${categoria}' no existe`);
        continue;
      }

      const existing = await assetExistsByTicker(symbol);
      if (existing) {
        skipped += 1;
        console.log(`SKIP  ${symbol}: ya existe (${existing.nombre})`);
        continue;
      }

      let yahooAsset;
      try {
        yahooAsset = await fetchWithRetry(symbol);
      } catch (err) {
        if (!FALLBACK_WITH_SYMBOL) throw err;
        yahooAsset = {
          nombre: SYMBOL_NAME_FALLBACK[symbol] || symbol,
          ticker: symbol,
          icono: null
        };
        console.log(`WARN  ${symbol}: Yahoo no disponible, usando fallback local`);
      }

      const insertId = await insertAsset({
        categoria_id: categoriaId,
        nombre: yahooAsset.nombre,
        ticker: yahooAsset.ticker,
        icono: yahooAsset.icono
      });

      created += 1;
      console.log(`OK    ${symbol}: creado id=${insertId} nombre='${yahooAsset.nombre}'`);
    } catch (err) {
      failed += 1;
      console.log(`FAIL  ${symbol}: ${err.message}`);
    }
  }

  console.log("");
  console.log("Summary:");
  console.log(`created=${created} skipped=${skipped} failed=${failed}`);
}

run()
  .catch((err) => {
    console.error("Fatal error:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
