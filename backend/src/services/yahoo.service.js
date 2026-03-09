import YahooFinance from "yahoo-finance2";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const yahooFinance = new YahooFinance();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SCRIPT_PATH = path.resolve(__dirname, "../../scripts/yahoo_api.py");

const PYTHON_FALLBACK_ENABLED =
  String(process.env.YAHOO_PYTHON_FALLBACK_ENABLED ?? "true").toLowerCase() !== "false";
const PYTHON_TIMEOUT_MS = Number(process.env.YAHOO_PYTHON_TIMEOUT_MS || 15000);

function normalizeSymbol(rawSymbol) {
  return String(rawSymbol || "").trim().toUpperCase();
}

function mapYahooQuoteMetrics(quote) {
  return {
    precio: Number.isFinite(Number(quote?.regularMarketPrice))
      ? Number(quote.regularMarketPrice)
      : null,
    capitalizacion: Number.isFinite(Number(quote?.marketCap)) ? Number(quote.marketCap) : null,
    volumen: Number.isFinite(Number(quote?.regularMarketVolume))
      ? Number(quote.regularMarketVolume)
      : null,
    variacion_porcentual: Number.isFinite(Number(quote?.regularMarketChangePercent))
      ? Number(quote.regularMarketChangePercent)
      : null,
    quote_type: quote?.quoteType ? String(quote.quoteType).toUpperCase() : null,
    moneda: quote?.currency || null,
    mercado: quote?.fullExchangeName || quote?.exchange || null
  };
}

function isRetryableYahooError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("failed to get crumb")
  );
}

function buildPythonCandidates() {
  const configured = String(process.env.YAHOO_PYTHON_BIN || "").trim();
  if (configured) return [configured];
  return ["python3", "python"];
}

function runPythonFallback(symbol, pythonBin) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [PYTHON_SCRIPT_PATH, "--symbol", symbol], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`timeout ejecutando ${pythonBin}`));
    }, Math.max(1000, PYTHON_TIMEOUT_MS));

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(stderr.trim() || `python exit code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err) {
        reject(new Error(`respuesta JSON invalida desde python: ${err.message}`));
      }
    });
  });
}

async function fetchWithPythonFallback(symbol) {
  if (!PYTHON_FALLBACK_ENABLED) {
    throw new Error("fallback python deshabilitado");
  }

  const candidates = buildPythonCandidates();
  let lastError = null;

  for (const bin of candidates) {
    try {
      return await runPythonFallback(symbol, bin);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `no se pudo ejecutar fallback python (${candidates.join(", ")}): ${lastError?.message || "error desconocido"}`
  );
}

export async function fetchYahooAssetBySymbol(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) {
    throw new Error("symbol requerido");
  }

  try {
    const fallback = await fetchWithPythonFallback(symbol);
    const ticker = String(fallback?.ticker || symbol).toUpperCase();
    const nombre = String(fallback?.nombre || ticker);
    if (ticker) {
      return {
        nombre,
        ticker,
        quote_type: fallback?.quote_type ? String(fallback.quote_type).toUpperCase() : null,
        icono: null
      };
    }
  } catch {
    // Intentar Yahoo JS como respaldo.
  }

  const quote = await yahooFinance.quote(symbol);
  if (!quote?.symbol) {
    throw new Error("No se encontro informacion del simbolo");
  }

  return {
    nombre: quote.longName || quote.shortName || quote.displayName || quote.symbol,
    ticker: quote.symbol,
    quote_type: quote?.quoteType ? String(quote.quoteType).toUpperCase() : null,
    icono: null
  }
}

export async function fetchYahooPriceBySymbol(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) {
    throw new Error("symbol requerido");
  }

  try {
    const fallback = await fetchWithPythonFallback(symbol);
    const price = Number(fallback?.precio);
    const ticker = String(fallback?.ticker || symbol).toUpperCase();
    if (ticker && Number.isFinite(price) && price > 0) {
      return {
        ticker,
        precio: price
      };
    }
  } catch {
    // Intentar Yahoo JS como respaldo.
  }

  const quote = await yahooFinance.quote(symbol);
  const price = Number(quote?.regularMarketPrice);
  if (!quote?.symbol || !Number.isFinite(price) || price <= 0) {
    throw new Error(`No se pudo obtener precio valido para ${symbol}`);
  }

  return {
    ticker: quote.symbol,
    precio: price
  };
}

export async function fetchYahooQuoteBySymbol(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) {
    throw new Error("symbol requerido");
  }

  try {
    const fallback = await fetchWithPythonFallback(symbol);
    const ticker = String(fallback?.ticker || symbol).toUpperCase();
    const price = Number(fallback?.precio);
    const capitalizacion = Number(fallback?.capitalizacion);
    const volumen = Number(fallback?.volumen);
    const variacion = Number(fallback?.variacion_porcentual);
    if (ticker) {
      return {
        ticker,
        precio: Number.isFinite(price) && price > 0 ? price : null,
        capitalizacion: Number.isFinite(capitalizacion) && capitalizacion > 0 ? capitalizacion : null,
        volumen: Number.isFinite(volumen) && volumen > 0 ? volumen : null,
        variacion_porcentual: Number.isFinite(variacion) ? variacion : null,
        quote_type: fallback?.quote_type ? String(fallback.quote_type).toUpperCase() : null,
        moneda: fallback?.moneda ? String(fallback.moneda) : null,
        mercado: fallback?.mercado ? String(fallback.mercado) : null
      };
    }
  } catch {
    // Intentar Yahoo JS como respaldo.
  }

  const quote = await yahooFinance.quote(symbol);
  if (!quote?.symbol) {
    throw new Error(`No se encontro informacion del simbolo ${symbol}`);
  }

  return {
    ticker: String(quote.symbol).toUpperCase(),
    ...mapYahooQuoteMetrics(quote)
  };
}

export async function fetchYahooInstrumentProfileBySymbol(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) {
    throw new Error("symbol requerido");
  }

  try {
    const fallback = await fetchWithPythonFallback(symbol);
    return {
      ticker: String(fallback?.ticker || symbol).toUpperCase(),
      quote_type: fallback?.quote_type ? String(fallback.quote_type).toUpperCase() : null,
      nombre: String(fallback?.nombre || symbol),
      sector: null,
      industria: null,
      fondo_familia: null,
      fondo_categoria: null,
      geografia: null
    };
  } catch {
    // Intentar Yahoo JS como respaldo.
  }

  const [quote, summary] = await Promise.all([
    yahooFinance.quote(symbol),
    yahooFinance.quoteSummary(symbol, {
      modules: ["price", "assetProfile", "fundProfile", "summaryProfile"]
    }).catch(() => ({}))
  ]);

  if (!quote?.symbol) {
    throw new Error(`No se encontro informacion del simbolo ${symbol}`);
  }

  const assetProfile = summary?.assetProfile || {};
  const fundProfile = summary?.fundProfile || {};
  const summaryProfile = summary?.summaryProfile || {};
  const price = summary?.price || {};

  return {
    ticker: String(quote.symbol).toUpperCase(),
    quote_type: quote?.quoteType ? String(quote.quoteType).toUpperCase() : null,
    nombre: quote.longName || quote.shortName || quote.displayName || quote.symbol,
    sector: assetProfile?.sector || summaryProfile?.sector || null,
    industria: assetProfile?.industry || summaryProfile?.industry || null,
    fondo_familia: fundProfile?.family || price?.fundFamily || null,
    fondo_categoria: fundProfile?.categoryName || null,
    geografia: fundProfile?.region || null
  };
}

function normalizeYahooNewsItem(item) {
  const publishedEpoch = Number(item?.providerPublishTime || 0);
  const publishedAt = Number.isFinite(publishedEpoch) && publishedEpoch > 0
    ? new Date(publishedEpoch * 1000).toISOString()
    : null;
  const thumbnail =
    item?.thumbnail?.resolutions?.find(
      (resolution) => Number(resolution?.width || 0) >= 320
    )?.url || item?.thumbnail?.resolutions?.[0]?.url || null;

  return {
    id: String(item?.uuid || item?.link || ""),
    titulo: String(item?.title || "").trim() || "Sin titulo",
    enlace: String(item?.link || "").trim() || null,
    proveedor: String(item?.publisher || "").trim() || "Yahoo Finance",
    publicado_en: publishedAt,
    tipo: String(item?.type || "").trim() || null,
    tickers_relacionados: Array.isArray(item?.relatedTickers)
      ? item.relatedTickers
          .map((ticker) => String(ticker || "").trim().toUpperCase())
          .filter(Boolean)
      : [],
    imagen: thumbnail
  };
}

export async function fetchYahooFinanceNewsByQuery(rawQuery, newsCount = 20) {
  const query = String(rawQuery || "").trim() || "market";
  const count = Math.max(1, Math.min(50, Number(newsCount) || 20));
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", "0");
  url.searchParams.set("newsCount", String(count));
  url.searchParams.set("enableFuzzyQuery", "false");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Invests App)"
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance news error ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload?.news) ? payload.news : [];
  return list.map(normalizeYahooNewsItem).filter((item) => item.id && item.enlace);
}
