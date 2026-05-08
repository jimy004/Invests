export function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

const CRYPTO_ALIASES = {
  "BTC-USD": "/icons/bitcoin.svg",
  "ETH-USD": "/icons/ethereum.svg",
  "SOL-USD": "/icons/solana.svg",
  "BNB-USD": "/icons/binancecoin.svg",
  "XRP-USD": "/icons/ripple.svg",
  "ADA-USD": "/icons/cardano.svg",
  "DOT-USD": "/icons/polkadot.svg",
  "USDT-USD": "/icons/tether.svg",
  "USDC-USD": "/icons/usd-coin.svg",
  "AVAX-USD": "/icons/avalanche-2.svg",
  "LTC-USD": "/icons/litecoin.svg",
  "TRX-USD": "/icons/tron.svg"
};

const CRYPTO_BASE_ALIASES = {
  BTC: "/icons/bitcoin.svg", ETH: "/icons/ethereum.svg",
  SOL: "/icons/solana.svg",  BNB: "/icons/binancecoin.svg",
  XRP: "/icons/ripple.svg",  ADA: "/icons/cardano.svg",
  DOT: "/icons/polkadot.svg",USDT: "/icons/tether.svg",
  USDC: "/icons/usd-coin.svg",AVAX: "/icons/avalanche-2.svg",
  LTC: "/icons/litecoin.svg", TRX: "/icons/tron.svg"
};

const CURRENCY_TICKERS = new Set([
  "USD","EUR","GBP","JPY","CHF","CAD","AUD","CNY","SEK","NOK","NZD","SGD","MXN","BRL"
]);

const GESTORA_ICON_MAP = {
  "vanguard group": "/icons/vanguard.svg",
  blackrock: "/icons/blackrock.svg",
  amundi: "/icons/amundi.svg",
  "fidelity investments": "/icons/fidelity.svg",
  invesco: "/icons/invesco.svg",
  "pictet group": "/icons/pictet.svg",
  "state street global advisors": "/icons/statestreet.svg"
};

export function buildLocalIconFromTicker(ticker) {
  const symbol = String(ticker || "").trim().toUpperCase();
  if (!symbol) return null;
  if (CRYPTO_ALIASES[symbol]) return CRYPTO_ALIASES[symbol];
  const [base, quote] = symbol.split("-");
  if (base && quote && CURRENCY_TICKERS.has(quote) && CRYPTO_BASE_ALIASES[base]) {
    return CRYPTO_BASE_ALIASES[base];
  }
  return `/icons/${symbol}.svg`;
}

export function resolveGestoraIconSrc(fondoDetalle, asset = null) {
  const raw = String(fondoDetalle?.gestora_icono || "").trim();
  if (isHttpUrl(raw) || raw.startsWith("/icons/")) return raw;
  const gestoraName = String(fondoDetalle?.gestora_nombre || "").trim().toLowerCase();
  if (GESTORA_ICON_MAP[gestoraName]) return GESTORA_ICON_MAP[gestoraName];
  const assetName = String(asset?.nombre || "").trim().toLowerCase();
  const ticker = String(asset?.ticker || "").trim().toUpperCase();
  const text = `${gestoraName} ${assetName}`.trim();
  if (text.includes("fidelity")) return "/icons/fidelity.svg";
  if (text.includes("vanguard")) return "/icons/vanguard.svg";
  if (text.includes("blackrock") || text.includes("ishares")) return "/icons/blackrock.svg";
  if (text.includes("amundi")) return "/icons/amundi.svg";
  if (text.includes("invesco")) return "/icons/invesco.svg";
  if (text.includes("pictet")) return "/icons/pictet.svg";
  if (text.includes("state street") || ticker === "SPY") return "/icons/statestreet.svg";
  return null;
}

export function resolveAssetIconSrc(asset, fondoDetalle = null) {
  if (Number(asset?.categoria_id || 0) === 3) {
    const gestoraIcon = resolveGestoraIconSrc(fondoDetalle, asset);
    if (gestoraIcon) return gestoraIcon;
  }
  const tickerSymbol = String(asset?.ticker || "").trim().toUpperCase();
  const mappedIconFromTicker = buildLocalIconFromTicker(tickerSymbol);
  const rawIcon = String(asset?.icono || "").trim();
  if (isHttpUrl(rawIcon)) return rawIcon;
  if (rawIcon.startsWith("/icons/")) {
    const expectedFromTicker = tickerSymbol ? `/icons/${tickerSymbol}.svg` : "";
    if (mappedIconFromTicker && expectedFromTicker && rawIcon.toUpperCase() === expectedFromTicker.toUpperCase()) {
      return mappedIconFromTicker;
    }
    return rawIcon;
  }
  return mappedIconFromTicker;
}

export function resolvePosicionLogoSrc(posicion) {
  const gestoraIcon = resolveGestoraIconSrc(posicion, posicion);
  if (gestoraIcon) return gestoraIcon;
  const rawIcon = String(posicion?.activo_icono || "").trim();
  if (isHttpUrl(rawIcon) || rawIcon.startsWith("/icons/")) return rawIcon;
  return buildLocalIconFromTicker(posicion?.ticker);
}
