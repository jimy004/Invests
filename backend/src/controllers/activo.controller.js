import * as Activo from "../models/activo.model.js";
import * as Categoria from "../models/categoria.model.js";
import * as DetallesAccion from "../models/detallesaccion.model.js";
import * as DetallesFondo from "../models/detallesfondo.model.js";
import * as Gestora from "../models/gestora.model.js";
import * as Politica from "../models/politica.model.js";
import * as Tipo from "../models/tipo.model.js";
import * as Geografia from "../models/geografia.model.js";
import * as Sector from "../models/sector.model.js";
import {
  fetchYahooAssetBySymbol,
  fetchYahooQuoteBySymbol,
  fetchYahooInstrumentProfileBySymbol
} from "../services/yahoo.service.js";

function shouldIncludeMarketData(value) {
  return String(value || "").toLowerCase() === "true";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const ICON_ALIAS_BY_TICKER = {
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

const EQUITY_SECTOR_MAP = {
  AAL: "Industria",
  AAPL: "Tecnologia",
  ADBE: "Tecnologia",
  AMD: "Tecnologia",
  AMT: "Inmobiliario",
  AMZN: "Consumo discrecional",
  ASML: "Tecnologia",
  AVGO: "Tecnologia",
  AXP: "Financiero",
  BA: "Industria",
  BABA: "Consumo discrecional",
  BAC: "Financiero",
  BBAR: "Financiero",
  BCS: "Financiero",
  BITF: "Tecnologia",
  BKNG: "Consumo discrecional",
  BLK: "Financiero",
  BP: "Energia",
  "BRK-B": "Financiero",
  C: "Financiero",
  CLSK: "Tecnologia",
  CMG: "Consumo discrecional",
  COIN: "Financiero",
  COP: "Energia",
  COST: "Consumo basico",
  CROX: "Consumo discrecional",
  CVX: "Energia",
  DB: "Financiero",
  DBX: "Tecnologia",
  DELL: "Tecnologia",
  DIS: "Consumo discrecional",
  DPZ: "Consumo discrecional",
  EA: "Tecnologia",
  EBAY: "Consumo discrecional",
  EOG: "Energia",
  EQIX: "Inmobiliario",
  EXPE: "Consumo discrecional",
  F: "Consumo discrecional",
  FDX: "Industria",
  GE: "Industria",
  GM: "Consumo discrecional",
  GOOGL: "Tecnologia",
  GOOG: "Tecnologia",
  GS: "Financiero",
  HUT: "Tecnologia",
  IBM: "Tecnologia",
  INTC: "Tecnologia",
  JNJ: "Salud",
  JPM: "Financiero",
  KHC: "Consumo basico",
  KO: "Consumo basico",
  LLY: "Salud",
  LULU: "Consumo discrecional",
  MA: "Financiero",
  MARA: "Tecnologia",
  MCD: "Consumo discrecional",
  META: "Tecnologia",
  MNST: "Consumo basico",
  MRNA: "Salud",
  MS: "Financiero",
  MSFT: "Tecnologia",
  MSTR: "Tecnologia",
  MTPLF: "Tecnologia",
  NDAQ: "Financiero",
  NEE: "Utilities",
  NFLX: "Telecomunicaciones",
  NKE: "Consumo discrecional",
  NTES: "Telecomunicaciones",
  NVDA: "Tecnologia",
  O: "Inmobiliario",
  ORCL: "Tecnologia",
  PEP: "Consumo basico",
  PFE: "Salud",
  PG: "Consumo basico",
  PHG: "Salud",
  PYPL: "Financiero",
  RACE: "Consumo discrecional",
  RIO: "Materiales",
  RIOT: "Tecnologia",
  SAN: "Financiero",
  SBUX: "Consumo discrecional",
  SHEL: "Energia",
  SHOP: "Tecnologia",
  SONY: "Consumo discrecional",
  SPOT: "Telecomunicaciones",
  T: "Telecomunicaciones",
  TEF: "Telecomunicaciones",
  TM: "Consumo discrecional",
  TMUS: "Telecomunicaciones",
  TSLA: "Consumo discrecional",
  TSM: "Tecnologia",
  UBER: "Industria",
  UNH: "Salud",
  UPS: "Industria",
  V: "Financiero",
  VOD: "Telecomunicaciones",
  VZ: "Telecomunicaciones",
  WEN: "Consumo discrecional",
  WFC: "Financiero",
  WMT: "Consumo basico",
  XIACF: "Tecnologia",
  XOM: "Energia"
};

function resolveIconPath(ticker, iconoActual = null) {
  const current = String(iconoActual || "").trim();
  if (current.startsWith("/icons/")) return current;

  const symbol = String(ticker || "").trim().toUpperCase();
  if (!symbol) return null;

  if (ICON_ALIAS_BY_TICKER[symbol]) return ICON_ALIAS_BY_TICKER[symbol];
  return `/icons/${symbol}.svg`;
}

function inferCategoryName({ ticker, quote_type }) {
  const symbol = String(ticker || "").trim().toUpperCase();
  const quoteType = String(quote_type || "").trim().toUpperCase();
  const isIsinLike = /^[A-Z]{2}[A-Z0-9]{10}$/.test(symbol);

  if (quoteType.includes("CRYPTO")) return "Criptomonedas";
  if (quoteType === "ETF" || quoteType === "MUTUALFUND") return "ETFs";
  if (quoteType === "EQUITY" || quoteType === "COMMONSTOCK") return "Acciones";
  if (quoteType === "BOND") return "Renta fija";
  if (quoteType === "MONEYMARKET") return "Liquidez";
  if (quoteType === "FUTURE" || quoteType === "OPTION") return "Derivados";

  if (symbol.endsWith("-USD")) return "Criptomonedas";
  if (isIsinLike) return "ETFs";
  return null;
}

async function getCategoryMapByNormalizedName() {
  const [rows] = await Categoria.getAllCategorias();
  const map = new Map();
  for (const row of rows) {
    map.set(normalizeText(row?.categoria), Number(row?.id));
  }
  return map;
}

function inferCategoryIdByAsset(assetData, categoryMap) {
  const categoryName = inferCategoryName(assetData);
  if (!categoryName) return null;
  return Number(categoryMap.get(normalizeText(categoryName)) || 0) || null;
}

function shouldReplaceCategory(currentCategoryName, currentCategoryId, inferredCategoryId) {
  if (!inferredCategoryId) return false;
  if (!currentCategoryId) return true;
  const current = normalizeText(currentCategoryName);
  return current === "criptomonedas" && Number(currentCategoryId) !== Number(inferredCategoryId);
}

function pickIdByCandidates(rows, fieldName, candidates = []) {
  if (!Array.isArray(rows) || !rows.length) return null;

  const normalizedCandidates = [...new Set(candidates.map((c) => normalizeText(c)).filter(Boolean))];
  if (!normalizedCandidates.length) return null;

  for (const candidate of normalizedCandidates) {
    const exact = rows.find((row) => normalizeText(row?.[fieldName]) === candidate);
    if (exact?.id) return Number(exact.id);
  }

  for (const candidate of normalizedCandidates) {
    const partial = rows.find((row) => {
      const value = normalizeText(row?.[fieldName]);
      return value && (value.includes(candidate) || candidate.includes(value));
    });
    if (partial?.id) return Number(partial.id);
  }

  return null;
}

function inferSectorCandidates(profile) {
  const ticker = String(profile?.ticker || "").trim().toUpperCase();
  if (EQUITY_SECTOR_MAP[ticker]) return [EQUITY_SECTOR_MAP[ticker]];

  const nameText = normalizeText(profile?.nombre);
  if (nameText) {
    if (/(bank|banc|financial|insurance|capital)/.test(nameText)) return ["Financiero"];
    if (/(pharma|health|medical|biotech)/.test(nameText)) return ["Salud"];
    if (/(software|tech|semiconductor|micro|systems|digital)/.test(nameText)) return ["Tecnologia"];
    if (/(energy|petroleum|oil|gas)/.test(nameText)) return ["Energia"];
    if (/(telecom|communications|wireless)/.test(nameText)) return ["Telecomunicaciones"];
    if (/(realty|real estate|properties)/.test(nameText)) return ["Inmobiliario"];
    if (/(beverage|food|consumer)/.test(nameText)) return ["Consumo basico"];
  }

  const raw = normalizeText(profile?.sector || profile?.industria);
  if (!raw) return [];
  const mapping = [
    ["technology", "Tecnologia"],
    ["tech", "Tecnologia"],
    ["health", "Salud"],
    ["health care", "Salud"],
    ["financial", "Financiero"],
    ["consumer cyclical", "Consumo discrecional"],
    ["consumer discretionary", "Consumo discrecional"],
    ["consumer defensive", "Consumo basico"],
    ["consumer staples", "Consumo basico"],
    ["energy", "Energia"],
    ["industrial", "Industria"],
    ["basic materials", "Materiales"],
    ["materials", "Materiales"],
    ["utilities", "Utilities"],
    ["communication", "Telecomunicaciones"],
    ["telecom", "Telecomunicaciones"],
    ["real estate", "Inmobiliario"]
  ];
  const candidate = mapping.find(([key]) => raw.includes(key))?.[1];
  if (candidate) return [candidate];

  // Ultimo fallback: si es una accion con icono local, no dejar sector vacio.
  if (String(profile?.quote_type || "").toUpperCase() === "EQUITY" && String(profile?.icono || "").trim()) {
    return ["Industria"];
  }

  return [profile?.sector, profile?.industria];
}

function inferGestoraCandidates(profile) {
  const family = String(profile?.fondo_familia || "").trim();
  const name = String(profile?.nombre || "").trim();
  const text = normalizeText(`${family} ${name}`);

  const candidates = [family];
  const alias = [
    ["vanguard", "Vanguard Group"],
    ["blackrock", "BlackRock"],
    ["amundi", "Amundi"],
    ["fidelity", "Fidelity Investments"],
    ["j.p. morgan", "J.P. Morgan Asset Management"],
    ["jp morgan", "J.P. Morgan Asset Management"],
    ["pictet", "Pictet Group"],
    ["ubs", "UBS Asset Management"],
    ["bnp", "BNP Paribas Asset Management"],
    ["dws", "DWS Group"],
    ["schroder", "Schroders"],
    ["invesco", "Invesco"],
    ["franklin", "Franklin Templeton"],
    ["axa", "AXA Investment Managers"],
    ["state street", "State Street Global Advisors"],
    ["hsbc", "HSBC Asset Management"]
  ];
  for (const [key, label] of alias) {
    if (text.includes(key)) candidates.push(label);
  }
  return candidates;
}

function inferPoliticaCandidates(profile) {
  const text = normalizeText(`${profile?.fondo_categoria || ""} ${profile?.nombre || ""}`);
  if (!text) return [];

  const candidates = [];
  if (text.includes("growth")) candidates.push("Growth");
  if (text.includes("value")) candidates.push("Value");
  if (text.includes("blend")) candidates.push("Blend");
  if (text.includes("income") || text.includes("dividend")) candidates.push("Income");
  if (text.includes("quality")) candidates.push("Quality");
  if (text.includes("small cap")) candidates.push("Small Cap");
  if (text.includes("mid cap")) candidates.push("Mid Cap");
  if (text.includes("large cap")) candidates.push("Large Cap");
  if (text.includes("thematic") || text.includes("theme")) candidates.push("Thematic");
  if (text.includes("esg") || text.includes("sustainable")) candidates.push("ESG / Sostenible");
  if (!candidates.length && text.includes("index")) candidates.push("Blend");
  return candidates;
}

function inferTipoCandidates(profile, categoriaId) {
  const text = normalizeText(`${profile?.fondo_categoria || ""} ${profile?.nombre || ""}`);
  const quoteType = normalizeText(profile?.quote_type);
  const candidates = [];

  if (quoteType === "etf" || text.includes("etf")) candidates.push("ETF");
  if (text.includes("index")) candidates.push("Fondo indexado");
  if (text.includes("bond") || text.includes("fixed income") || text.includes("renta fija")) {
    candidates.push("Fondo de renta fija");
  }
  if (text.includes("money market") || text.includes("monetario")) candidates.push("Fondo monetario");
  if (text.includes("mixed") || text.includes("balanced") || text.includes("mixto")) {
    candidates.push("Fondo mixto");
  }
  if (text.includes("sector")) candidates.push("Fondo sectorial");
  if (text.includes("thematic") || text.includes("theme")) candidates.push("Fondo tematico");
  if (text.includes("real estate")) candidates.push("Fondo inmobiliario");
  if (text.includes("commodity")) candidates.push("Fondo de materias primas");
  if (!candidates.length && Number(categoriaId) === 3) candidates.push("ETF");
  return candidates;
}

function inferGeografiaCandidates(profile) {
  const text = normalizeText(`${profile?.geografia || ""} ${profile?.fondo_categoria || ""}`);
  if (!text) return ["Globales"];

  const mapping = [
    ["global", "Globales"],
    ["developed", "Developed Markets"],
    ["emerging", "Emerging Markets"],
    ["frontier", "Frontier Markets"],
    ["north america", "Norteamerica"],
    ["europe", "Europa"],
    ["asia", "Asia-Pacifico"],
    ["latin", "Latinoamerica"],
    ["middle east", "Oriente Medio"],
    ["africa", "Africa"],
    ["united states", "Estados Unidos"],
    ["usa", "Estados Unidos"],
    ["china", "China"],
    ["india", "India"],
    ["japan", "Japon"],
    ["germany", "Alemania"],
    ["france", "Francia"],
    ["united kingdom", "Reino Unido"],
    ["spain", "Espana"],
    ["switzerland", "Suiza"],
    ["brazil", "Brasil"]
  ];
  const candidate = mapping.find(([key]) => text.includes(key))?.[1];
  return candidate ? [candidate, "Globales"] : ["Globales"];
}

async function ensureAssetDetailsByCategory(activoId, categoriaId, context = {}) {
  const categoryId = Number(categoriaId || 0);
  if (!Number.isInteger(categoryId) || categoryId <= 0) return;

  const [activoRows] = await Activo.getActivoById(activoId);
  const activo = activoRows?.[0];
  if (!activo) return;

  const ticker = String(context?.ticker || activo.ticker || "").trim().toUpperCase();
  const nombre = String(context?.nombre || activo.nombre || "").trim();
  let profile = {
    ticker,
    nombre,
    quote_type: context?.quote_type || null,
    icono: context?.icono || activo.icono || null,
    sector: null,
    industria: null,
    fondo_familia: null,
    fondo_categoria: null,
    geografia: null
  };

  if (ticker) {
    try {
      profile = {
        ...profile,
        ...(await fetchYahooInstrumentProfileBySymbol(ticker))
      };
    } catch {
      // Sin datos externos, se crean detalles con fallback local.
    }
  }

  if (categoryId === 2) {
    const [sectores] = await Sector.getAllSectores();
    let sectorIdInferido = pickIdByCandidates(sectores, "nombre", inferSectorCandidates(profile));
    if (!sectorIdInferido && String(profile?.icono || "").trim()) {
      sectorIdInferido = pickIdByCandidates(sectores, "nombre", ["Industria"]);
    }

    const [rows] = await DetallesAccion.getDetallesAccionByActivo(activoId);
    if (!rows.length && sectorIdInferido) {
      await DetallesAccion.createDetallesAccion({
        activo_id: activoId,
        sector_id: sectorIdInferido
      });
    } else if (!rows.length) {
      await DetallesAccion.createDetallesAccion({
        activo_id: activoId,
        sector_id: null
      });
    } else if (!rows[0]?.sector_id && sectorIdInferido) {
      await DetallesAccion.updateDetallesAccion(rows[0].id, {
        activo_id: activoId,
        sector_id: sectorIdInferido
      });
    }
    return;
  }

  if (categoryId === 3) {
    const [gestorasRows, politicasRows, tiposRows, geografiasRows, sectoresRows] = await Promise.all([
      Gestora.getAllGestoras(),
      Politica.getAllPoliticas(),
      Tipo.getAllTipos(),
      Geografia.getAllGeografias(),
      Sector.getAllSectores()
    ]);
    const gestoras = gestorasRows[0] || [];
    const politicas = politicasRows[0] || [];
    const tipos = tiposRows[0] || [];
    const geografias = geografiasRows[0] || [];
    const sectores = sectoresRows[0] || [];

    const gestoraIdInferida = pickIdByCandidates(gestoras, "nombre", inferGestoraCandidates(profile));
    const politicaIdInferida = pickIdByCandidates(politicas, "politica", inferPoliticaCandidates(profile));
    const tipoIdInferido = pickIdByCandidates(tipos, "tipo", inferTipoCandidates(profile, categoryId));
    const geografiaIdInferida = pickIdByCandidates(
      geografias,
      "geografia",
      inferGeografiaCandidates(profile)
    );
    const sectorIdInferido = pickIdByCandidates(sectores, "nombre", inferSectorCandidates(profile));

    const [rows] = await DetallesFondo.getDetallesFondoByActivo(activoId);
    if (!rows.length) {
      await DetallesFondo.createDetallesFondo({
        activo_id: activoId,
        gestora_id: gestoraIdInferida,
        politica_id: politicaIdInferida,
        tipo_id: tipoIdInferido,
        geografia_id: geografiaIdInferida,
        sector_id: sectorIdInferido
      });
    } else {
      const current = rows[0];
      await DetallesFondo.updateDetallesFondo(current.id, {
        activo_id: activoId,
        gestora_id: current.gestora_id || gestoraIdInferida || null,
        politica_id: current.politica_id || politicaIdInferida || null,
        tipo_id: current.tipo_id || tipoIdInferido || null,
        geografia_id: current.geografia_id || geografiaIdInferida || null,
        sector_id: current.sector_id || sectorIdInferido || null
      });
    }
  }
}

async function enrichActivoWithMarketData(activo) {
  const ticker = String(activo?.ticker || "").trim();
  if (!ticker) {
    return {
      ...activo,
      precio: null,
      capitalizacion: null,
      volumen: null,
      variacion_porcentual: null,
      moneda: null,
      mercado: null
    };
  }

  try {
    const marketData = await fetchYahooQuoteBySymbol(ticker);
    return {
      ...activo,
      ...marketData
    };
  } catch {
    return {
      ...activo,
      precio: null,
      capitalizacion: null,
      volumen: null,
      variacion_porcentual: null,
      moneda: null,
      mercado: null
    };
  }
}

export const getAll = async (req, res) => {
  try {
    const [rows] = await Activo.getAllActivos();
    if (!shouldIncludeMarketData(req.query.include_market_data)) {
      return res.json(rows);
    }
    const enriched = await Promise.all(rows.map((row) => enrichActivoWithMarketData(row)));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const [rows] = await Activo.getActivoById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    if (!shouldIncludeMarketData(req.query.include_market_data)) {
      return res.json(rows[0]);
    }
    const enriched = await enrichActivoWithMarketData(rows[0]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getByCategoria = async (req, res) => {
  try {
    const [rows] = await Activo.getActivosByCategoria(req.params.categoria_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { categoria_id, nombre, ticker, icono } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ 
        message: "El nombre es requerido" 
      });
    }
    
    const [result] = await Activo.createActivo({ 
      categoria_id, 
      nombre, 
      ticker, 
      icono 
    });

    await ensureAssetDetailsByCategory(result.insertId, categoria_id, { ticker, nombre });
    
    // Obtener el activo creado con sus relaciones
    const [activoCreado] = await Activo.getActivoById(result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      ...activoCreado[0],
      message: "Activo creado exitosamente"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "La categoría especificada no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const [result] = await Activo.updateActivo(req.params.id, req.body);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    
    // Obtener el activo actualizado
    const [activoActualizado] = await Activo.getActivoById(req.params.id);
    
    res.json({
      ...activoActualizado[0],
      message: "Activo actualizado"
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: "La categoría especificada no existe" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const [result] = await Activo.deleteActivoCascade(req.params.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.json({ message: "Activo eliminado" });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: "No se puede eliminar el activo porque tiene posiciones, detalles de fondo u otros registros asociados" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const importFromYahoo = async (req, res) => {
  try {
    const { symbol, categoria_id = null } = req.body;
    const normalizedSymbol = String(symbol || "").trim().toUpperCase();

    if (!normalizedSymbol) {
      return res.status(400).json({ message: "symbol es requerido" });
    }

    const [existentes] = await Activo.getActivoByTicker(normalizedSymbol);
    const categoryMap = await getCategoryMapByNormalizedName();
    if (existentes.length > 0) {
      const existente = existentes[0];
      let categoriaResuelta = Number(categoria_id || 0) || null;
      if (!categoriaResuelta) {
        const quoteData = await fetchYahooQuoteBySymbol(normalizedSymbol);
        categoriaResuelta = inferCategoryIdByAsset(
          { ticker: normalizedSymbol, quote_type: quoteData?.quote_type },
          categoryMap
        );
      }

      if (shouldReplaceCategory(existente.categoria, existente.categoria_id, categoriaResuelta)) {
        await Activo.updateActivoCategoria(existente.id, categoriaResuelta);
      }
      const iconoResueltoExistente = resolveIconPath(existente.ticker || normalizedSymbol, existente.icono);
      if (!existente.icono && iconoResueltoExistente) {
        await Activo.updateActivoIcono(existente.id, iconoResueltoExistente);
      }

      const [actualizado] = await Activo.getActivoById(existente.id);
      await ensureAssetDetailsByCategory(actualizado[0]?.id, actualizado[0]?.categoria_id, {
        ticker: actualizado[0]?.ticker,
        nombre: actualizado[0]?.nombre
      });
      return res.status(200).json({
        ...actualizado[0],
        message: "El activo ya existe"
      });
    }

    const yahooAsset = await fetchYahooAssetBySymbol(normalizedSymbol);
    const categoriaInferida = inferCategoryIdByAsset(
      { ticker: yahooAsset.ticker || normalizedSymbol, quote_type: yahooAsset?.quote_type },
      categoryMap
    );
    const categoriaResuelta = categoriaInferida || Number(categoria_id || 0) || null;

    const [result] = await Activo.createActivo({
      categoria_id: categoriaResuelta,
      nombre: yahooAsset.nombre,
      ticker: yahooAsset.ticker,
      icono: resolveIconPath(yahooAsset.ticker || normalizedSymbol, yahooAsset.icono)
    });

    await ensureAssetDetailsByCategory(result.insertId, categoriaResuelta, {
      ticker: yahooAsset.ticker || normalizedSymbol,
      nombre: yahooAsset.nombre,
      quote_type: yahooAsset?.quote_type
    });

    const [rows] = await Activo.getActivoById(result.insertId);
    res.status(201).json({
      ...rows[0],
      message: "Activo importado desde Yahoo Finance"
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "La categoria especificada no existe"
      });
    }
    res.status(500).json({ error: err.message });
  }
};

export const recategorizar = async (req, res) => {
  try {
    const [activos] = await Activo.getAllActivos();
    const categoryMap = await getCategoryMapByNormalizedName();

    let actualizados = 0;
    let procesados = 0;
    const errores = [];

    for (const activo of activos) {
      const ticker = String(activo?.ticker || "").trim().toUpperCase();
      if (!ticker) continue;

      procesados += 1;
      try {
        const quoteData = await fetchYahooQuoteBySymbol(ticker);
        const categoriaInferidaId = inferCategoryIdByAsset(
          { ticker, quote_type: quoteData?.quote_type },
          categoryMap
        );
        if (shouldReplaceCategory(activo.categoria, activo.categoria_id, categoriaInferidaId)) {
          await Activo.updateActivoCategoria(activo.id, categoriaInferidaId);
          actualizados += 1;
        }
        const categoriaFinalId = categoriaInferidaId || activo.categoria_id;
        await ensureAssetDetailsByCategory(activo.id, categoriaFinalId, {
          ticker,
          nombre: activo.nombre,
          icono: activo.icono,
          quote_type: quoteData?.quote_type
        });
      } catch (err) {
        errores.push({ ticker, error: err.message });
      }
    }

    res.json({
      message: "Recategorizacion completada",
      procesados,
      actualizados,
      errores
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
