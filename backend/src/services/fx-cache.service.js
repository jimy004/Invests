import { fetchYahooPriceBySymbol } from "./yahoo.service.js";

const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_MS || 5 * 60 * 1000);
const cache = new Map();

function getCached(from, to) {
  const key = `${from}->${to}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.rate;
}

function setCached(from, to, rate) {
  cache.set(`${from}->${to}`, { rate, expiresAt: Date.now() + FX_CACHE_TTL_MS });
}

export async function getFxRate(fromTicker, toTicker) {
  if (!fromTicker || !toTicker || fromTicker === toTicker) return 1;

  const cached = getCached(fromTicker, toTicker);
  if (cached !== null) return cached;

  try {
    const symbol = `${fromTicker}${toTicker}=X`;
    const { precio } = await fetchYahooPriceBySymbol(symbol);
    if (Number.isFinite(precio) && precio > 0) {
      setCached(fromTicker, toTicker, precio);
      return precio;
    }
  } catch {
    // fallback
  }
  return 1;
}
