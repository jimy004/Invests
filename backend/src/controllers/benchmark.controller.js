import { fetchYahooPriceBySymbol } from "../services/yahoo.service.js";

const BENCHMARKS = {
  "SP500":       "^GSPC",
  "IBEX35":      "^IBEX",
  "EUROSTOXX50": "^STOXX50E",
  "NASDAQ":      "^IXIC",
  "DAX":         "^GDAXI"
};

async function fetchHistoricalViaYahooV8(symbol, period1Unix, period2Unix, interval = "1mo") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1Unix}&period2=${period2Unix}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Invests App)" }
  });
  if (!res.ok) throw new Error(`Yahoo v8 error ${res.status} for ${symbol}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No data from Yahoo v8");

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  return timestamps.map((ts, i) => ({
    fecha: new Date(ts * 1000).toISOString().slice(0, 10),
    close: Number(closes[i] || 0)
  })).filter((p) => p.close > 0);
}

export const getHistorico = async (req, res) => {
  try {
    const { symbol = "SP500", periodo = "1y" } = req.query;
    const yahooSymbol = BENCHMARKS[symbol] || symbol;

    const periodoMap = { "3m": 90, "6m": 180, "1y": 365, "2y": 730, "5y": 1825 };
    const days = periodoMap[periodo] || 365;
    const end = Math.floor(Date.now() / 1000);
    const start = end - days * 86400;

    const points = await fetchHistoricalViaYahooV8(yahooSymbol, start, end, "1mo");

    if (!points.length) {
      return res.json({ symbol: yahooSymbol, label: symbol, points: [] });
    }

    const baseline = points[0].close;
    const normalized = points.map((p) => ({
      fecha: p.fecha,
      close: p.close,
      rentabilidad: baseline !== 0 ? ((p.close - baseline) / baseline) * 100 : 0
    }));

    res.json({ symbol: yahooSymbol, label: symbol, points: normalized });
  } catch (err) {
    console.error("[benchmark] Error:", err.message);
    res.status(500).json({ error: err.message, points: [] });
  }
};

export const getBenchmarks = (_req, res) => {
  res.json(Object.keys(BENCHMARKS).map((key) => ({ key, symbol: BENCHMARKS[key], label: key })));
};
