import { Fragment, useEffect, useState } from "react";
import {
  actualizarCashFlow,
  actualizarPortafolio,
  actualizarResumenPeso,
  actualizarUsuario,
  crearCashFlow,
  crearPosicion,
  crearPortafolio,
  crearUsuario,
  ejecutarOrdenCompra,
  ejecutarOrdenVenta,
  eliminarPortfolioSnapshot,
  eliminarTodasNotificacionesUsuario,
  eliminarCashFlow,
  eliminarOrden,
  eliminarPortafolio,
  getActivos,
  getCashFlowsByUsuario,
  getCategorias,
  getDetallesAccionByActivo,
  getDetallesFondoByActivo,
  generarSnapshotPortafolio,
  generarSnapshotsPosicionesPortafolio,
  getMonedas,
  getNotificacionesByUsuario,
  getNotificacionesUnreadCount,
  getNoticiasYahoo,
  getOrdenesByPortafolio,
  getPortfolioSnapshotsByPortafolio,
  getPortfolioSnapshotsByPortafolioPeriodo,
  generarSnapshotsTodosPortafolios,
  getPosicionesByPortafolio,
  getPosicionSnapshotsByPortafolio,
  getPortafoliosByUsuario,
  getResumenCashFlowUsuario,
  getResumenesByUsuario,
  getResumenPosicionesPortafolio,
  importarActivoDesdeYahoo,
  getSnapshotConfigByUsuario,
  loginUsuario,
  markAllNotificacionesRead,
  markNotificacionRead,
  logoutUsuario,
  updateSnapshotConfigByUsuario,
  getPrecioAlertasByUsuario,
  crearPrecioAlerta,
  eliminarPrecioAlerta,
  getWatchlistByUsuario,
  crearWatchlistItem,
  eliminarWatchlistItem,
  getObjetivosByUsuario,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  getDividendosByPortafolio,
  crearDividendo,
  eliminarDividendo,
  getBenchmarkHistorico,
  actualizarPosicionNota
} from "./lib/api";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Treemap,
  XAxis,
  YAxis
} from "recharts";

export default function App() {
  const LIST_PAGE_SIZE = 10;
  const SNAPSHOT_INTERVAL_OPTIONS = [
    { value: "60",     label: "Cada hora" },
    { value: "480",    label: "Cada 8 horas" },
    { value: "1440",   label: "Cada 24 horas" },
    { value: "10080",  label: "Cada semana" },
    { value: "43200",  label: "Cada mes" },
    { value: "129600", label: "Cada 3 meses" },
    { value: "259200", label: "Cada 6 meses" },
    { value: "525600", label: "Cada año" }
  ];
  const CASHFLOW_CATEGORIAS = [
    "restaurantes",
    "super e hipers",
    "bizum",
    "electronica y electrodomesticos",
    "transporte",
    "gasolina",
    "vivienda",
    "alquiler o hipoteca",
    "suministros",
    "internet y telefono",
    "salud y farmacia",
    "seguros",
    "educacion",
    "ropa y calzado",
    "ocio y suscripciones",
    "viajes",
    "mascotas",
    "regalos",
    "impuestos y tasas",
    "nomina",
    "ahorro e inversion",
    "transferencias",
    "otros"
  ].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  const CHART_COLORS = [
    "#2563eb",
    "#f97316",
    "#16a34a",
    "#e11d48",
    "#0f766e",
    "#d97706",
    "#7c3aed",
    "#0369a1",
    "#ca8a04",
    "#334155"
  ];

  const [tab, setTab] = useState("login");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [portafolios, setPortafolios] = useState([]);
  const [resumenes, setResumenes] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [activos, setActivos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pfNombre, setPfNombre] = useState("");
  const [pfMonedaId, setPfMonedaId] = useState("");
  const [pfCategoriaId, setPfCategoriaId] = useState("");
  const [showPortafolioForm, setShowPortafolioForm] = useState(false);
  const [selectedPortafolio, setSelectedPortafolio] = useState(null);
  const [posiciones, setPosiciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [expandedOrdenId, setExpandedOrdenId] = useState(null);
  const [resumenPosiciones, setResumenPosiciones] = useState(null);
  const [loadingPosiciones, setLoadingPosiciones] = useState(false);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [showOrdenForm, setShowOrdenForm] = useState(false);
  const [ordenTipo, setOrdenTipo] = useState("compra");
  const [ordenActivoId, setOrdenActivoId] = useState("");
  const [ordenActivoTicker, setOrdenActivoTicker] = useState("");
  const [ordenPosicionId, setOrdenPosicionId] = useState("");
  const [ordenCantidad, setOrdenCantidad] = useState("");
  const [ordenPrecio, setOrdenPrecio] = useState("");
  const [ordenComision, setOrdenComision] = useState("0");
  const [ordenObservacion, setOrdenObservacion] = useState("");
  const [loadingActivoYahoo, setLoadingActivoYahoo] = useState(false);
  const [showZeroPosiciones, setShowZeroPosiciones] = useState(false);
  const [currentPage, setCurrentPage] = useState("inicio");
  const [settingsMonedaId, setSettingsMonedaId] = useState("");
  const [resumenPesoDrafts, setResumenPesoDrafts] = useState({});
  const [savingResumenId, setSavingResumenId] = useState(null);
  const [cashFlows, setCashFlows] = useState([]);
  const [cashFlowResumen, setCashFlowResumen] = useState(null);
  const [loadingCashFlow, setLoadingCashFlow] = useState(false);
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [cashFlowCalendarCursor, setCashFlowCalendarCursor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [cashFlowSelectedDate, setCashFlowSelectedDate] = useState("");
  const [cashFlowSelectedMonthType, setCashFlowSelectedMonthType] = useState("");
  const [editingCashFlowId, setEditingCashFlowId] = useState(null);
  const [cashFlowTipo, setCashFlowTipo] = useState("ingreso");
  const [cashFlowCategoria, setCashFlowCategoria] = useState("otros");
  const [cashFlowMonedaId, setCashFlowMonedaId] = useState("");
  const [cashFlowNombre, setCashFlowNombre] = useState("");
  const [cashFlowFecha, setCashFlowFecha] = useState("");
  const [cashFlowAporte, setCashFlowAporte] = useState("");
  const [cashFlowObservacion, setCashFlowObservacion] = useState("");
  const [snapshotPortafolioId, setSnapshotPortafolioId] = useState("");
  const [snapshotFechaInicio, setSnapshotFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [snapshotFechaFin, setSnapshotFechaFin] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [portfolioSnapshots, setPortfolioSnapshots] = useState([]);
  const [posicionSnapshots, setPosicionSnapshots] = useState([]);
  const [expandedPortfolioSnapshotId, setExpandedPortfolioSnapshotId] = useState(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [snapshotConfigEnabled, setSnapshotConfigEnabled] = useState(false);
  const [snapshotIntervalPortafolio, setSnapshotIntervalPortafolio] = useState("1440");
  const [snapshotIntervalPosicion, setSnapshotIntervalPosicion] = useState("1440");
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadNotificaciones, setUnreadNotificaciones] = useState(0);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);
  const [settingsAutoSaveMessage, setSettingsAutoSaveMessage] = useState("");
  const [expandedPosicionId, setExpandedPosicionId] = useState(null);
  const [detalleAccionPosicion, setDetalleAccionPosicion] = useState(null);
  const [detalleFondoPosicion, setDetalleFondoPosicion] = useState(null);
  const [loadingDetallePosicion, setLoadingDetallePosicion] = useState(false);
  const [portafoliosPage, setPortafoliosPage] = useState(1);
  const [ordenesPage, setOrdenesPage] = useState(1);
  const [movimientosPage, setMovimientosPage] = useState(1);
  const [snapshotsPage, setSnapshotsPage] = useState(1);
  const [notificacionesPage, setNotificacionesPage] = useState(1);
  const [posicionesSort, setPosicionesSort] = useState({
    key: "precio_actual",
    direction: "desc"
  });
  const [loadingInicioCharts, setLoadingInicioCharts] = useState(false);
  const [inicioPortfolioSeries, setInicioPortfolioSeries] = useState([]);
  const [inicioPortfolioKeys, setInicioPortfolioKeys] = useState([]);
  const [inicioRentabilidadSeries, setInicioRentabilidadSeries] = useState([]);
  const [hiddenInicioPortfolioKeys, setHiddenInicioPortfolioKeys] = useState({});
  const [inicioPortfolioChartMode, setInicioPortfolioChartMode] = useState("line");
  const [inicioRentabilidadChartMode, setInicioRentabilidadChartMode] = useState("line");
  const [loadingPosicionCharts, setLoadingPosicionCharts] = useState(false);
  const [posicionesEvolutionSeries, setPosicionesEvolutionSeries] = useState([]);
  const [posicionesEvolutionKeys, setPosicionesEvolutionKeys] = useState([]);
  const [selectedPosicionChartKey, setSelectedPosicionChartKey] = useState("");
  const [visiblePosicionChartKeys, setVisiblePosicionChartKeys] = useState([]);
  const [posicionesRentabilidadSeries, setPosicionesRentabilidadSeries] = useState([]);
  const [posicionesEvolutionChartMode, setPosicionesEvolutionChartMode] = useState("line");
  const [posicionesRentabilidadChartMode, setPosicionesRentabilidadChartMode] = useState("line");
  const [posicionesPesoChartMode, setPosicionesPesoChartMode] = useState("posiciones");
  const [loadingNoticias, setLoadingNoticias] = useState(false);
  const [noticiasRecientes, setNoticiasRecientes] = useState([]);
  const [noticiasFetchedAt, setNoticiasFetchedAt] = useState("");

  // ── Dark mode ──────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("darkMode") === "1"; } catch { return false; }
  });

  // ── Precio alertas ─────────────────────────────────────────────────────────
  const [precioAlertas, setPrecioAlertas] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);
  const [alertaActivoId, setAlertaActivoId] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("mayor");
  const [alertaPrecio, setAlertaPrecio] = useState("");

  // ── Watchlist ──────────────────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [watchlistActivoTicker, setWatchlistActivoTicker] = useState("");
  const [watchlistNota, setWatchlistNota] = useState("");
  const [showWatchlistForm, setShowWatchlistForm] = useState(false);

  // ── Objetivos financieros ──────────────────────────────────────────────────
  const [objetivos, setObjetivos] = useState([]);
  const [loadingObjetivos, setLoadingObjetivos] = useState(false);
  const [showObjetivoForm, setShowObjetivoForm] = useState(false);
  const [editingObjetivoId, setEditingObjetivoId] = useState(null);
  const [objNombre, setObjNombre] = useState("");
  const [objMontoObjetivo, setObjMontoObjetivo] = useState("");
  const [objFechaObjetivo, setObjFechaObjetivo] = useState("");
  const [objMontoInicial, setObjMontoInicial] = useState("");
  const [objNota, setObjNota] = useState("");

  // ── Dividendos ─────────────────────────────────────────────────────────────
  const [dividendos, setDividendos] = useState([]);
  const [loadingDividendos, setLoadingDividendos] = useState(false);
  const [showDividendoForm, setShowDividendoForm] = useState(false);
  const [divPosicionId, setDivPosicionId] = useState("");
  const [divFecha, setDivFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [divImporte, setDivImporte] = useState("");
  const [divMonedaId, setDivMonedaId] = useState("");
  const [divObservacion, setDivObservacion] = useState("");

  // ── Benchmark ──────────────────────────────────────────────────────────────
  const [benchmarkSymbol, setBenchmarkSymbol] = useState("SP500");
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // ── Simulador de escenarios (por categoría) ───────────────────────────────

  // ── Drag & drop portafolios ────────────────────────────────────────────────
  const [dragPortafolioId, setDragPortafolioId] = useState(null);
  const [portafoliosOrder, setPortafoliosOrder] = useState([]);

  // ── Nota por posición ──────────────────────────────────────────────────────
  const [editingNotaPosicionId, setEditingNotaPosicionId] = useState(null);
  const [notaPosicionDraft, setNotaPosicionDraft] = useState("");

  // ── Risk metric info tooltip ───────────────────────────────────────────────
  const [showRiskInfo, setShowRiskInfo] = useState(null);

  // ── Sub-páginas laterales ──────────────────────────────────────────────────
  const [portafolioSubPage, setPortafolioSubPage] = useState("posiciones");
  const [inicioSubPage, setInicioSubPage] = useState("resumen");
  const [cashflowSubPage, setCashflowSubPage] = useState("graficos");
  const [watchlistSubPage, setWatchlistSubPage] = useState("watchlist");

  // ── Objetivos portafolios seleccionados ────────────────────────────────────
  const [objetivoPortafolioIds, setObjetivoPortafolioIds] = useState([]);
  const [editObjetivoPortafolioIds, setEditObjetivoPortafolioIds] = useState([]);

  // ── Escenario por categoría ───────────────────────────────────────────────
  const [scenarioShocks, setScenarioShocks] = useState({});
  const [scenarioMode, setScenarioMode] = useState("category");
  const [monteCarloYears, setMonteCarloYears] = useState(10);
  const [monteCarloRuns, setMonteCarloRuns] = useState(500);
  // Feature 7: ruin threshold
  const [ruinThreshold, setRuinThreshold] = useState(50);
  // Feature 8: monthly contributions
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  // Feature 9: rebalancing comparison
  const [showMcRebalancing, setShowMcRebalancing] = useState(false);
  // Feature 11: dividend yield
  const [dividendYieldPct, setDividendYieldPct] = useState(0);
  // Override manual del retorno anual en Monte Carlo (null = usar el calculado)
  const [mcRetornoOverride, setMcRetornoOverride] = useState("");
  // Feature 12: saved scenarios
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");
  // Feature 4/5/6: view toggles
  const [showImpactTable, setShowImpactTable] = useState(false);
  const [showWaterfall, setShowWaterfall] = useState(false);
  const [showScenarioTreemap, setShowScenarioTreemap] = useState(false);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);

  const formatLargeNumber = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return numeric.toLocaleString("es-ES");
  };

  const formatPrice = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return numeric.toFixed(4);
  };

  const formatPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return `${numeric.toFixed(2)}%`;
  };
  const formatPriceOrDashZero = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "-";
    return numeric.toFixed(4);
  };
  const formatLargeNumberOrDashZero = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "-";
    return numeric.toLocaleString("es-ES");
  };
  const formatPercentOrDashZero = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "-";
    return `${numeric.toFixed(2)}%`;
  };
  const formatCashFlowCategoria = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "Otros";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };
  const formatSnapshotDate = (value) => {
    if (!value) return "-";
    const raw = String(value).trim();
    const datePart = raw.slice(0, 10);
    const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return datePart || "-";
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
  };
  const formatSnapshotTime = (value) => {
    if (!value) return "-";
    const raw = String(value).trim();
    const hasExplicitTime = /\d{2}:\d{2}/.test(raw);
    if (!hasExplicitTime) return "-";

    const hasZone = /Z$/i.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw);
    if (hasZone || raw.includes("T")) {
      const date = new Date(raw);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
      }
    }

    const match = raw.match(/(\d{2}:\d{2}(?::\d{2})?)/);
    if (!match) return "-";
    return match[1].length === 5 ? `${match[1]}:00` : match[1];
  };
  const formatNewsDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };
  const renderDirectionBadge = (direction, label, tone = "default") => (
    <span
      className={`directionBadge directionBadge${tone}`}
      title={label}
      aria-label={label}
    >
      {direction === "left" ? "\u2190" : "\u2192"}
    </span>
  );
  const PIE_LABEL_MIN_PERCENT = 0.04;
  const renderPiePercentLabel = ({ percent }) => {
    const pct = Number(percent || 0) * 100;
    if (!Number.isFinite(pct) || pct < PIE_LABEL_MIN_PERCENT * 100) return "";
    return `${pct.toFixed(0)}%`;
  };
  const buildPiePercentTooltipFormatter =
    (total, label = "Peso") =>
    (value) => {
      const numeric = Number(value || 0);
      const pct = total ? (numeric / total) * 100 : 0;
      return [`${pct.toFixed(2)}%`, label];
    };
  const buildMonthlySeriesLastPoint = (points) => {
    const list = Array.isArray(points) ? points : [];
    const byMonth = new Map();

    for (const point of list) {
      const fecha = String(point?.fecha || "").trim();
      const match = fecha.match(/^(\d{4}-\d{2})/);
      if (!match) continue;
      const monthKey = match[1];
      const existing = byMonth.get(monthKey);
      if (!existing || String(point?.fecha || "") > String(existing?.fecha || "")) {
        byMonth.set(monthKey, point);
      }
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, point]) => ({
        ...point,
        mes: monthKey,
        mes_label: `${monthKey.slice(5, 7)}/${monthKey.slice(0, 4)}`
      }));
  };
  const buildPosicionesEvolution = (snapshotRows, totalRows = []) => {
    const normalizeDateTimeKey = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
      return raw.replace("T", " ").replace("Z", "").slice(0, 19);
    };
    const list = Array.isArray(snapshotRows) ? snapshotRows : [];
    const totalsList = Array.isArray(totalRows) ? totalRows : [];
    if (!list.length && !totalsList.length) {
      return { keys: [], points: [] };
    }

    const keyMap = new Map();
    const valuesByTimestamp = new Map();
    const totalsByTimestamp = new Map();

    for (const row of totalsList) {
      const key = normalizeDateTimeKey(row?.fecha);
      if (!key) continue;
      totalsByTimestamp.set(key, Number(row?.valor || 0));
      if (!valuesByTimestamp.has(key)) {
        valuesByTimestamp.set(key, new Map());
      }
    }

    for (const row of list) {
      const fecha = normalizeDateTimeKey(row?.fecha);
      if (!fecha) continue;
      const posicionId = Number(row?.posicion_id || 0);
      const key = posicionId > 0 ? `pos_${posicionId}` : `pos_${String(row?.activo_nombre || "sin_nombre")}`;
      if (!keyMap.has(key)) {
        const label = `${row?.activo_nombre || "Posicion"}${row?.ticker ? ` (${row.ticker})` : ""}`;
        keyMap.set(key, { key, label });
      }
      if (!valuesByTimestamp.has(fecha)) {
        valuesByTimestamp.set(fecha, new Map());
      }
      valuesByTimestamp
        .get(fecha)
        .set(key, Number.isFinite(Number(row?.valor)) ? Number(row.valor) : 0);
    }

    const orderedTimestamps = Array.from(valuesByTimestamp.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    const points = [];
    for (const timestamp of orderedTimestamps) {
      const valuesAtTimestamp = valuesByTimestamp.get(timestamp) || new Map();
      const point = {
        fecha: timestamp,
        fecha_label: formatSnapshotDate(timestamp)
      };
      let total = 0;
      for (const key of keyMap.keys()) {
        const value = Number(valuesAtTimestamp.get(key) || 0);
        point[key] = value;
        total += value;
      }
      if (totalsByTimestamp.has(timestamp)) {
        total = Number(totalsByTimestamp.get(timestamp) || 0);
      }
      point.total = total;
      points.push(point);
    }

    const finalPoint = points[points.length - 1] || {};
    const keys = Array.from(keyMap.values())
      .sort((a, b) => Number(finalPoint[b.key] || 0) - Number(finalPoint[a.key] || 0))
      .map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    return {
      keys,
      points: points.slice(-180)
    };
  };
  const buildRentabilidadSeries = (snapshotRows) => {
    const ordered = (Array.isArray(snapshotRows) ? snapshotRows : [])
      .map((row) => ({
        fecha: String(row?.fecha || ""),
        valor: Number(row?.valor || 0)
      }))
      .filter((row) => row.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!ordered.length) return [];

    const baseline = Number(ordered[0]?.valor || 0);
    return ordered.slice(-180).map((point) => ({
      fecha: point.fecha,
      fecha_label: formatSnapshotDate(point.fecha),
      rentabilidad: baseline !== 0 ? ((Number(point.valor || 0) - baseline) / baseline) * 100 : 0
    }));
  };

  const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());
  const buildLocalIconFromTicker = (ticker) => {
    const symbol = String(ticker || "").trim().toUpperCase();
    if (!symbol) return null;
    const aliases = {
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
    if (aliases[symbol]) return aliases[symbol];

    const currencyTickers = new Set([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CHF",
      "CAD",
      "AUD",
      "CNY",
      "SEK",
      "NOK",
      "NZD",
      "SGD",
      "MXN",
      "BRL"
    ]);
    const [base, quote] = symbol.split("-");
    if (base && quote && currencyTickers.has(quote)) {
      const baseAliases = {
        BTC: "/icons/bitcoin.svg",
        ETH: "/icons/ethereum.svg",
        SOL: "/icons/solana.svg",
        BNB: "/icons/binancecoin.svg",
        XRP: "/icons/ripple.svg",
        ADA: "/icons/cardano.svg",
        DOT: "/icons/polkadot.svg",
        USDT: "/icons/tether.svg",
        USDC: "/icons/usd-coin.svg",
        AVAX: "/icons/avalanche-2.svg",
        LTC: "/icons/litecoin.svg",
        TRX: "/icons/tron.svg"
      };
      if (baseAliases[base]) {
        return baseAliases[base];
      }
    }

    return `/icons/${symbol}.svg`;
  };
  const resolveGestoraIconSrc = (fondoDetalle, asset = null) => {
    const raw = String(fondoDetalle?.gestora_icono || "").trim();
    if (isHttpUrl(raw) || raw.startsWith("/icons/")) return raw;

    const gestoraName = String(fondoDetalle?.gestora_nombre || "").trim().toLowerCase();
    const assetName = String(asset?.nombre || "").trim().toLowerCase();
    const ticker = String(asset?.ticker || "").trim().toUpperCase();
    const gestoraIconMap = {
      "vanguard group": "/icons/vanguard.svg",
      blackrock: "/icons/blackrock.svg",
      amundi: "/icons/amundi.svg",
      "fidelity investments": "/icons/fidelity.svg",
      invesco: "/icons/invesco.svg",
      "pictet group": "/icons/pictet.svg",
      "state street global advisors": "/icons/statestreet.svg"
    };
    if (gestoraIconMap[gestoraName]) return gestoraIconMap[gestoraName];

    // Fallback por texto si no hay gestora asociada en DetallesFondo.
    const text = `${gestoraName} ${assetName}`.trim();
    if (text.includes("fidelity")) return "/icons/fidelity.svg";
    if (text.includes("vanguard")) return "/icons/vanguard.svg";
    if (text.includes("blackrock") || text.includes("ishares")) return "/icons/blackrock.svg";
    if (text.includes("amundi")) return "/icons/amundi.svg";
    if (text.includes("invesco")) return "/icons/invesco.svg";
    if (text.includes("pictet")) return "/icons/pictet.svg";
    if (text.includes("state street") || ticker === "SPY") return "/icons/statestreet.svg";

    return null;
  };
  const resolveAssetIconSrc = (asset, fondoDetalle = null) => {
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
      if (
        mappedIconFromTicker &&
        expectedFromTicker &&
        rawIcon.toUpperCase() === expectedFromTicker.toUpperCase()
      ) {
        return mappedIconFromTicker;
      }
      return rawIcon;
    }
    return mappedIconFromTicker;
  };
  const resolvePosicionLogoSrc = (posicion) => {
    const gestoraIcon = resolveGestoraIconSrc(posicion, posicion);
    if (gestoraIcon) return gestoraIcon;
    const rawIcon = String(posicion?.activo_icono || "").trim();
    if (isHttpUrl(rawIcon) || rawIcon.startsWith("/icons/")) return rawIcon;
    return buildLocalIconFromTicker(posicion?.ticker);
  };

  useEffect(() => {
    try { localStorage.setItem("darkMode", darkMode ? "1" : "0"); } catch { /* no-op */ }
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem("usuario");
    const token = localStorage.getItem("auth_token");
    const refresh = localStorage.getItem("refresh_token");
    if (saved && token && refresh) {
      setUsuario(JSON.parse(saved));
    } else {
      localStorage.removeItem("usuario");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setUsuario(null);
      setNombre("");
      setPassword("");
      setMessage("");
      setError("Sesion expirada. Inicia sesion nuevamente.");
      setPortafolios([]);
      setResumenes([]);
      setMonedas([]);
      setCategorias([]);
      setActivos([]);
      setEditingId(null);
      clearPortafolioForm();
      setSelectedPortafolio(null);
      setPosiciones([]);
      setOrdenes([]);
      setExpandedOrdenId(null);
      setResumenPosiciones(null);
      clearOrdenForm();
      clearResumenEdits();
      clearCashFlowForm();
      setCashFlows([]);
      setCashFlowResumen(null);
      setSnapshotPortafolioId("");
      setSnapshotFechaInicio(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setSnapshotFechaFin(new Date().toISOString().slice(0, 10));
      setPortfolioSnapshots([]);
      setPosicionSnapshots([]);
      setExpandedPortfolioSnapshotId(null);
      setSnapshotConfigEnabled(false);
      setSnapshotIntervalPortafolio("1440");
      setSnapshotIntervalPosicion("1440");
      setNotificaciones([]);
      setUnreadNotificaciones(0);
      setLoadingPosicionCharts(false);
      setPosicionesEvolutionSeries([]);
      setPosicionesEvolutionKeys([]);
      setSelectedPosicionChartKey("");
      setVisiblePosicionChartKeys([]);
      setPosicionesRentabilidadSeries([]);
      setLoadingNoticias(false);
      setNoticiasRecientes([]);
      setNoticiasFetchedAt("");
      setHiddenInicioPortfolioKeys({});
      setCurrentPage("inicio");
      setSettingsMonedaId("");
    }
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (tab === "login") {
        const res = await loginUsuario({ nombre, password });
        setUsuario(res.usuario);
        localStorage.setItem("usuario", JSON.stringify(res.usuario));
        localStorage.setItem("auth_token", res.access_token || res.token);
        localStorage.setItem("refresh_token", res.refresh_token);
        setCurrentPage("inicio");
        setSettingsMonedaId(res.usuario?.moneda_id ? String(res.usuario.moneda_id) : "");
        setMessage("Sesion iniciada correctamente");
      } else {
        await crearUsuario({ nombre, password });
        setMessage("Usuario creado. Ahora puedes iniciar sesion");
        setTab("login");
      }
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await logoutUsuario();
    setUsuario(null);
    setNombre("");
    setPassword("");
    setMessage("");
    setError("");
    setPortafolios([]);
    setResumenes([]);
    setMonedas([]);
    setCategorias([]);
    setActivos([]);
    setEditingId(null);
    clearPortafolioForm();
    setSelectedPortafolio(null);
    setPosiciones([]);
    setOrdenes([]);
    setExpandedOrdenId(null);
    setResumenPosiciones(null);
    clearOrdenForm();
    clearResumenEdits();
    clearCashFlowForm();
    setCashFlows([]);
    setCashFlowResumen(null);
    setSnapshotPortafolioId("");
    setSnapshotFechaInicio(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setSnapshotFechaFin(new Date().toISOString().slice(0, 10));
    setPortfolioSnapshots([]);
    setPosicionSnapshots([]);
    setExpandedPortfolioSnapshotId(null);
    setSnapshotConfigEnabled(false);
    setSnapshotIntervalPortafolio("1440");
    setSnapshotIntervalPosicion("1440");
    setNotificaciones([]);
    setUnreadNotificaciones(0);
    setLoadingPosicionCharts(false);
    setPosicionesEvolutionSeries([]);
    setPosicionesEvolutionKeys([]);
    setSelectedPosicionChartKey("");
    setVisiblePosicionChartKeys([]);
    setPosicionesRentabilidadSeries([]);
    setLoadingNoticias(false);
    setNoticiasRecientes([]);
    setNoticiasFetchedAt("");
    setHiddenInicioPortfolioKeys({});
    setCurrentPage("inicio");
    setSettingsMonedaId("");
  }

  useEffect(() => {
    if (!usuario) return;
    setSettingsMonedaId(usuario.moneda_id ? String(usuario.moneda_id) : "");
  }, [usuario]);

  function clearPortafolioForm() {
    setPfNombre("");
    setPfMonedaId("");
    setPfCategoriaId("");
  }

  function clearOrdenForm() {
    setOrdenTipo("compra");
    setOrdenActivoId("");
    setOrdenActivoTicker("");
    setOrdenPosicionId("");
    setOrdenCantidad("");
    setOrdenPrecio("");
    setOrdenComision("0");
    setOrdenObservacion("");
  }

  function clearResumenEdits() {
    setResumenPesoDrafts({});
    setSavingResumenId(null);
  }

  function clearCashFlowForm() {
    setEditingCashFlowId(null);
    setCashFlowTipo("ingreso");
    setCashFlowCategoria("otros");
    setCashFlowMonedaId(usuario?.moneda_id ? String(usuario.moneda_id) : "");
    setCashFlowNombre("");
    setCashFlowFecha("");
    setCashFlowAporte("");
    setCashFlowObservacion("");
  }

  async function loadSnapshotConfigData(currentUsuario) {
    try {
      const config = await getSnapshotConfigByUsuario(currentUsuario.id);
      const interval = String(
        config?.interval_portafolio_minutes ?? config?.interval_posicion_minutes ?? 1440
      );
      setSnapshotConfigEnabled(Boolean(config?.enabled));
      setSnapshotIntervalPortafolio(interval);
      setSnapshotIntervalPosicion(interval);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadNotificacionesData(currentUsuario) {
    setLoadingNotificaciones(true);
    try {
      const [list, unread] = await Promise.all([
        getNotificacionesByUsuario(currentUsuario.id, { onlyUnread: false, limit: 50 }),
        getNotificacionesUnreadCount(currentUsuario.id)
      ]);
      setNotificaciones(Array.isArray(list) ? list : []);
      setUnreadNotificaciones(Number(unread?.unread_count || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNotificaciones(false);
    }
  }

  async function loadActivosData({ silent = false } = {}) {
    if (!silent) {
      setLoadingData(true);
      setError("");
    }
    try {
      const activosList = await getActivos({ includeMarketData: true });
      setActivos(Array.isArray(activosList) ? activosList : []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoadingData(false);
      }
    }
  }

  async function loadDashboardData(currentUsuario, { silent = false } = {}) {
    if (!silent) {
      setLoadingData(true);
      setError("");
    }
    try {
      const [list, monedasList, categoriasList, activosList, resumenesList] = await Promise.all([
        getPortafoliosByUsuario(currentUsuario.id),
        getMonedas(),
        getCategorias(),
        getActivos(),
        getResumenesByUsuario(currentUsuario.id)
      ]);
      const portafoliosList = Array.isArray(list) ? list : [];
      setPortafolios(portafoliosList);
      setMonedas(Array.isArray(monedasList) ? monedasList : []);
      setCategorias(Array.isArray(categoriasList) ? categoriasList : []);
      setActivos(Array.isArray(activosList) ? activosList : []);
      setResumenes(Array.isArray(resumenesList) ? resumenesList : []);
      if (selectedPortafolio) {
        const updatedSelected = portafoliosList.find((p) => p.id === selectedPortafolio.id);
        if (updatedSelected) {
          setSelectedPortafolio(updatedSelected);
        } else {
          setSelectedPortafolio(null);
          setPosiciones([]);
          setOrdenes([]);
          setExpandedOrdenId(null);
          setResumenPosiciones(null);
          setPosicionesEvolutionKeys([]);
          setPosicionesEvolutionSeries([]);
          setSelectedPosicionChartKey("");
          setVisiblePosicionChartKeys([]);
          setPosicionesRentabilidadSeries([]);
          clearOrdenForm();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoadingData(false);
      }
    }
  }

  useEffect(() => {
    if (!usuario) return;
    loadDashboardData(usuario);
    loadSnapshotConfigData(usuario);
    loadNotificacionesData(usuario);
  }, [usuario]);

  useEffect(() => {
    if (!usuario || currentPage !== "cashflow") return;
    loadCashFlowData(usuario);
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "noticias") return;
    loadNoticiasData();
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "watchlist") return;
    loadWatchlistData(usuario);
    loadAlertasData(usuario);
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "objetivos") return;
    loadObjetivosData(usuario);
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "dividendos" || !selectedPortafolio) return;
    loadDividendosData(selectedPortafolio.id);
  }, [usuario, currentPage, selectedPortafolio]);

  useEffect(() => {
    if (!usuario?.moneda_id) return;
    if (!cashFlowMonedaId) {
      setCashFlowMonedaId(String(usuario.moneda_id));
    }
  }, [usuario?.moneda_id, cashFlowMonedaId]);

  useEffect(() => {
    if (!usuario || currentPage !== "inicio") return;
    const intervalId = setInterval(() => {
      loadDashboardData(usuario, { silent: true });
    }, 60000);
    return () => clearInterval(intervalId);
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "noticias") return;
    const intervalId = setInterval(() => {
      loadNoticiasData({ silent: true });
    }, 300000);
    return () => clearInterval(intervalId);
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "portafolio" || !expandedPosicionId) {
      setDetalleAccionPosicion(null);
      setDetalleFondoPosicion(null);
      setLoadingDetallePosicion(false);
      return;
    }

    const posicionSeleccionada = posiciones.find(
      (posicion) => String(posicion.id) === String(expandedPosicionId)
    );
    if (!posicionSeleccionada) {
      setDetalleAccionPosicion(null);
      setDetalleFondoPosicion(null);
      setLoadingDetallePosicion(false);
      return;
    }

    const activoPosicion = activos.find(
      (activo) => String(activo.id) === String(posicionSeleccionada.activo_id)
    );
    const categoriaId = Number(
      activoPosicion?.categoria_id || posicionSeleccionada?.categoria_id || 0
    );
    if (categoriaId !== 2 && categoriaId !== 3) {
      setDetalleAccionPosicion(null);
      setDetalleFondoPosicion(null);
      setLoadingDetallePosicion(false);
      return;
    }

    let cancelled = false;
    setLoadingDetallePosicion(true);
    (async () => {
      try {
        if (categoriaId === 2) {
          const list = await getDetallesAccionByActivo(posicionSeleccionada.activo_id);
          if (!cancelled) {
            setDetalleAccionPosicion(Array.isArray(list) && list.length ? list[0] : null);
            setDetalleFondoPosicion(null);
          }
          return;
        }
        const list = await getDetallesFondoByActivo(posicionSeleccionada.activo_id);
        if (!cancelled) {
          setDetalleFondoPosicion(Array.isArray(list) && list.length ? list[0] : null);
          setDetalleAccionPosicion(null);
        }
      } catch {
        if (!cancelled) {
          setDetalleAccionPosicion(null);
          setDetalleFondoPosicion(null);
        }
      } finally {
        if (!cancelled) setLoadingDetallePosicion(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [usuario, currentPage, expandedPosicionId, posiciones, activos]);

  useEffect(() => {
    if (!expandedPosicionId) return;
    const exists = posiciones.some((posicion) => String(posicion.id) === String(expandedPosicionId));
    if (!exists) {
      setExpandedPosicionId(null);
    }
  }, [expandedPosicionId, posiciones]);

  useEffect(() => {
    if (!portafolios.length) {
      setSnapshotPortafolioId("");
      return;
    }
    const exists = portafolios.some((p) => String(p.id) === snapshotPortafolioId);
    if (!snapshotPortafolioId || !exists) {
      setSnapshotPortafolioId(String(portafolios[0].id));
    }
  }, [portafolios, snapshotPortafolioId]);

  useEffect(() => {
    if (!usuario || currentPage !== "snapshots" || !snapshotPortafolioId) return;
    loadSnapshotsData();
  }, [usuario, currentPage, snapshotPortafolioId]);

  useEffect(() => {
    setPortafoliosPage(1);
    setOrdenesPage(1);
    setMovimientosPage(1);
    setSnapshotsPage(1);
    setNotificacionesPage(1);
  }, [currentPage]);

  useEffect(() => {
    setPortafoliosOrder(portafolios.map((p) => p.id));
  }, [portafolios]);

  useEffect(() => {
    if (!usuario || !showBenchmark || currentPage !== "inicio") return;
    setLoadingBenchmark(true);
    getBenchmarkHistorico(benchmarkSymbol, "1y")
      .then((data) => setBenchmarkData(Array.isArray(data?.points) ? data.points : []))
      .catch(() => setBenchmarkData([]))
      .finally(() => setLoadingBenchmark(false));
  }, [usuario, showBenchmark, benchmarkSymbol, currentPage]);

  useEffect(() => {
    if (!usuario || (currentPage !== "inicio" && currentPage !== "portafolio")) {
      setLoadingInicioCharts(false);
      setInicioPortfolioKeys([]);
      setInicioPortfolioSeries([]);
      setInicioRentabilidadSeries([]);
      return;
    }
    if (!portafolios.length) {
      setLoadingInicioCharts(false);
      setInicioPortfolioKeys([]);
      setInicioPortfolioSeries([]);
      setInicioRentabilidadSeries([]);
      return;
    }

    let cancelled = false;
    setLoadingInicioCharts(true);

    (async () => {
      try {
        const portfolioConfigs = await Promise.all(
          portafolios.map(async (portafolio, index) => {
            let list = [];
            try {
              const response = await getPortfolioSnapshotsByPortafolio(portafolio.id);
              list = Array.isArray(response) ? response : [];
            } catch {
              list = [];
            }
            return {
              key: `pf_${portafolio.id}`,
              label: portafolio.nombre || `Portafolio ${portafolio.id}`,
              color: CHART_COLORS[index % CHART_COLORS.length],
              snapshots: list
                .map((row) => ({
                  fecha: String(row?.fecha || ""),
                  valor: Number(row?.valor || 0)
                }))
                .filter((row) => row.fecha)
            };
          })
        );

        if (cancelled) return;

        const snapshotsByTimestamp = new Map();
        for (const config of portfolioConfigs) {
          for (const snapshot of config.snapshots) {
            if (!snapshotsByTimestamp.has(snapshot.fecha)) {
              snapshotsByTimestamp.set(snapshot.fecha, []);
            }
            snapshotsByTimestamp.get(snapshot.fecha).push({
              key: config.key,
              valor: Number.isFinite(snapshot.valor) ? snapshot.valor : 0
            });
          }
        }

        const orderedTimestamps = Array.from(snapshotsByTimestamp.keys()).sort((a, b) =>
          a.localeCompare(b)
        );
        const runningValues = {};
        const points = [];
        for (const timestamp of orderedTimestamps) {
          const updates = snapshotsByTimestamp.get(timestamp) || [];
          for (const item of updates) {
            runningValues[item.key] = item.valor;
          }

          const point = {
            fecha: timestamp,
            fecha_label: formatSnapshotDate(timestamp)
          };
          let total = 0;
          for (const config of portfolioConfigs) {
            const value = Number(runningValues[config.key] || 0);
            point[config.key] = value;
            total += value;
          }
          point.total = total;
          points.push(point);
        }

        const limitedPoints = points.slice(-180);
        const baseline = Number(limitedPoints[0]?.total || 0);
        const rentabilidadPoints = limitedPoints.map((point) => ({
          fecha: point.fecha,
          fecha_label: point.fecha_label,
          rentabilidad: baseline !== 0 ? ((Number(point.total || 0) - baseline) / baseline) * 100 : 0
        }));

        setInicioPortfolioKeys(
          portfolioConfigs.map(({ key, label, color }) => ({
            key,
            label,
            color
          }))
        );
        setInicioPortfolioSeries(limitedPoints);
        setInicioRentabilidadSeries(rentabilidadPoints);
      } finally {
        if (!cancelled) {
          setLoadingInicioCharts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [usuario, currentPage, portafolios]); // also loads for portafolio page (needed by Monte Carlo in simulator)

  useEffect(() => {
    setHiddenInicioPortfolioKeys((prev) => {
      const allowedKeys = new Set(inicioPortfolioKeys.map((item) => item.key));
      const next = {};
      for (const [key, value] of Object.entries(prev)) {
        if (allowedKeys.has(key)) {
          next[key] = Boolean(value);
        }
      }
      return next;
    });
  }, [inicioPortfolioKeys]);

  useEffect(() => {
    const allowedKeys = new Set(posicionesEvolutionKeys.map((item) => item.key));
    setVisiblePosicionChartKeys((prev) => prev.filter((key) => allowedKeys.has(key)));
    setSelectedPosicionChartKey((prev) => {
      if (prev && allowedKeys.has(prev)) return prev;
      return posicionesEvolutionKeys[0]?.key || "";
    });
  }, [posicionesEvolutionKeys]);

  useEffect(() => {
    if (Number(selectedPortafolio?.categoria_id || 0) === 2) return;
    if (posicionesPesoChartMode !== "posiciones") {
      setPosicionesPesoChartMode("posiciones");
    }
  }, [selectedPortafolio?.categoria_id, posicionesPesoChartMode]);

  useEffect(() => {
    if (!settingsAutoSaveMessage) return;
    const timerId = setTimeout(() => {
      setSettingsAutoSaveMessage("");
    }, 2600);
    return () => clearTimeout(timerId);
  }, [settingsAutoSaveMessage]);

  useEffect(() => {
    if (!message) return;
    const timerId = setTimeout(() => {
      setMessage("");
    }, 3200);
    return () => clearTimeout(timerId);
  }, [message]);

  async function loadWatchlistData(currentUsuario) {
    setLoadingWatchlist(true);
    try {
      const list = await getWatchlistByUsuario(currentUsuario.id);
      setWatchlist(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingWatchlist(false);
    }
  }

  async function loadObjetivosData(currentUsuario) {
    setLoadingObjetivos(true);
    try {
      const list = await getObjetivosByUsuario(currentUsuario.id);
      setObjetivos(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingObjetivos(false);
    }
  }

  async function loadAlertasData(currentUsuario) {
    setLoadingAlertas(true);
    try {
      const list = await getPrecioAlertasByUsuario(currentUsuario.id);
      setPrecioAlertas(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAlertas(false);
    }
  }

  async function loadDividendosData(portafolioId) {
    setLoadingDividendos(true);
    try {
      const list = await getDividendosByPortafolio(portafolioId);
      setDividendos(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDividendos(false);
    }
  }

  async function handleCrearAlerta(e) {
    e.preventDefault();
    if (!usuario || !alertaActivoId || !alertaPrecio) return;
    setLoading(true);
    setError("");
    try {
      await crearPrecioAlerta({
        usuario_id: usuario.id,
        activo_id: Number(alertaActivoId),
        tipo: alertaTipo,
        precio_objetivo: Number(alertaPrecio)
      });
      setMessage("Alerta creada");
      setShowAlertaForm(false);
      setAlertaActivoId("");
      setAlertaPrecio("");
      await loadAlertasData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarAlerta(id) {
    if (!confirm("Eliminar alerta?")) return;
    try {
      await eliminarPrecioAlerta(id);
      setMessage("Alerta eliminada");
      setPrecioAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCrearWatchlistItem() {
    if (!usuario || !watchlistActivoTicker.trim()) return;
    setLoading(true);
    setError("");
    try {
      let activoId = activos.find(
        (a) => a.ticker?.toUpperCase() === watchlistActivoTicker.trim().toUpperCase()
      )?.id;
      if (!activoId) {
        activoId = await importActivoPorTicker(watchlistActivoTicker, { silent: true, setOrderFields: false });
      }
      await crearWatchlistItem({ usuario_id: usuario.id, activo_id: activoId, nota: watchlistNota });
      setMessage("Añadido a watchlist");
      setShowWatchlistForm(false);
      setWatchlistActivoTicker("");
      setWatchlistNota("");
      await loadWatchlistData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarWatchlistItem(id) {
    if (!confirm("Eliminar de watchlist?")) return;
    try {
      await eliminarWatchlistItem(id);
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function clearObjetivoForm() {
    setEditingObjetivoId(null);
    setObjNombre("");
    setObjMontoObjetivo("");
    setObjFechaObjetivo("");
    setObjMontoInicial("");
    setObjNota("");
    setObjetivoPortafolioIds([]);
    setEditObjetivoPortafolioIds([]);
  }

  async function handleObjetivoSubmit(e) {
    e.preventDefault();
    if (!usuario) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        usuario_id: usuario.id,
        nombre: objNombre.trim(),
        monto_objetivo: Number(objMontoObjetivo),
        fecha_objetivo: objFechaObjetivo,
        monto_inicial: Number(objMontoInicial || 0),
        nota: objNota.trim() || null,
        portafolio_ids: objetivoPortafolioIds.length ? JSON.stringify(objetivoPortafolioIds) : null
      };
      if (editingObjetivoId) {
        await actualizarObjetivo(editingObjetivoId, payload);
        setMessage("Objetivo actualizado");
      } else {
        await crearObjetivo(payload);
        setMessage("Objetivo creado");
      }
      clearObjetivoForm();
      setShowObjetivoForm(false);
      await loadObjetivosData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarObjetivo(id) {
    if (!confirm("Eliminar objetivo?")) return;
    try {
      await eliminarObjetivo(id);
      setMessage("Objetivo eliminado");
      setObjetivos((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCrearDividendo(e) {
    e.preventDefault();
    if (!selectedPortafolio || !divPosicionId || !divImporte) return;
    setLoading(true);
    setError("");
    try {
      await crearDividendo({
        posicion_id: Number(divPosicionId),
        fecha: divFecha,
        importe: Number(divImporte),
        moneda_id: divMonedaId ? Number(divMonedaId) : null,
        observacion: divObservacion.trim() || null
      });
      setMessage("Dividendo registrado");
      setShowDividendoForm(false);
      setDivImporte("");
      setDivObservacion("");
      await loadDividendosData(selectedPortafolio.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarDividendo(id) {
    if (!confirm("Eliminar dividendo?")) return;
    try {
      await eliminarDividendo(id);
      setMessage("Dividendo eliminado");
      setDividendos((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGuardarNotaPosicion(posicionId) {
    try {
      await actualizarPosicionNota(posicionId, notaPosicionDraft);
      setPosiciones((prev) =>
        prev.map((p) => (p.id === posicionId ? { ...p, nota: notaPosicionDraft } : p))
      );
      setEditingNotaPosicionId(null);
      setMessage("Nota guardada");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDragStartPortafolio(id) {
    setDragPortafolioId(id);
  }
  function handleDragOverPortafolio(e, id) {
    e.preventDefault();
    if (dragPortafolioId == null || dragPortafolioId === id) return;
    setPortafoliosOrder((prev) => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(dragPortafolioId);
      const toIdx = arr.indexOf(id);
      if (fromIdx < 0 || toIdx < 0) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, dragPortafolioId);
      return arr;
    });
  }
  function handleDragEndPortafolio() {
    setDragPortafolioId(null);
  }

  async function loadCashFlowData(currentUsuario) {
    setLoadingCashFlow(true);
    setError("");
    try {
      const [cashFlowList, resumen] = await Promise.all([
        getCashFlowsByUsuario(currentUsuario.id),
        getResumenCashFlowUsuario(currentUsuario.id).catch(() => null)
      ]);
      setCashFlows(Array.isArray(cashFlowList) ? cashFlowList : []);
      setCashFlowResumen(resumen);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCashFlow(false);
    }
  }

  async function loadNoticiasData({ silent = false } = {}) {
    if (!silent) {
      setLoadingNoticias(true);
      setError("");
    }
    try {
      const payload = await getNoticiasYahoo();
      setNoticiasRecientes(Array.isArray(payload?.recientes) ? payload.recientes : []);
      setNoticiasFetchedAt(String(payload?.fetched_at || ""));
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoadingNoticias(false);
      }
    }
  }

  async function loadSnapshotsData() {
    if (!snapshotPortafolioId) return;

    setLoadingSnapshots(true);
    setError("");
    if (snapshotFechaInicio && snapshotFechaFin && snapshotFechaInicio > snapshotFechaFin) {
      setLoadingSnapshots(false);
      setError("La fecha de inicio no puede ser mayor que la fecha fin.");
      return;
    }
    try {
      const portafolioId = Number(snapshotPortafolioId);
      const [portfolioList, posicionList] = await Promise.all([
        snapshotFechaInicio && snapshotFechaFin
          ? getPortfolioSnapshotsByPortafolioPeriodo(
              portafolioId,
              snapshotFechaInicio,
              snapshotFechaFin
            )
          : getPortfolioSnapshotsByPortafolio(portafolioId),
        getPosicionSnapshotsByPortafolio(portafolioId)
      ]);

      const posicionesFiltradas = (Array.isArray(posicionList) ? posicionList : []).filter((row) => {
        const fecha = String(row.fecha || "").slice(0, 10);
        if (snapshotFechaInicio && fecha < snapshotFechaInicio) return false;
        if (snapshotFechaFin && fecha > snapshotFechaFin) return false;
        return true;
      });

      setPortfolioSnapshots(Array.isArray(portfolioList) ? portfolioList : []);
      setPosicionSnapshots(posicionesFiltradas);
      setExpandedPortfolioSnapshotId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSnapshots(false);
    }
  }

  async function loadPosiciones(portafolio) {
    setLoadingPosiciones(true);
    setLoadingOrdenes(true);
    setLoadingPosicionCharts(true);
    setError("");
    try {
      const [list, resumen, ordenesList, portfolioSnapshotList, posicionSnapshotList] = await Promise.all([
        getPosicionesByPortafolio(portafolio.id),
        getResumenPosicionesPortafolio(portafolio.id).catch(() => null),
        getOrdenesByPortafolio(portafolio.id),
        getPortfolioSnapshotsByPortafolio(portafolio.id).catch(() => []),
        getPosicionSnapshotsByPortafolio(portafolio.id).catch(() => [])
      ]);
      setSelectedPortafolio(portafolio);
      setPosiciones(Array.isArray(list) ? list : []);
      setOrdenes(Array.isArray(ordenesList) ? ordenesList : []);
      setExpandedOrdenId(null);
      setResumenPosiciones(resumen);
      setExpandedPosicionId(null);
      setOrdenesPage(1);
      clearOrdenForm();

      const posicionesEvolution = buildPosicionesEvolution(posicionSnapshotList, portfolioSnapshotList);
      setPosicionesEvolutionKeys(posicionesEvolution.keys);
      setPosicionesEvolutionSeries(posicionesEvolution.points);
      setSelectedPosicionChartKey(posicionesEvolution.keys[0]?.key || "");
      setVisiblePosicionChartKeys([]);
      setPosicionesRentabilidadSeries(buildRentabilidadSeries(portfolioSnapshotList));
    } catch (err) {
      setPosicionesEvolutionKeys([]);
      setPosicionesEvolutionSeries([]);
      setSelectedPosicionChartKey("");
      setVisiblePosicionChartKeys([]);
      setPosicionesRentabilidadSeries([]);
      setError(err.message);
    } finally {
      setLoadingPosiciones(false);
      setLoadingOrdenes(false);
      setLoadingPosicionCharts(false);
    }
  }

  async function handlePortafolioSubmit(event) {
    event.preventDefault();
    if (!usuario) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        usuario_id: usuario.id,
        nombre: pfNombre.trim(),
        moneda_id: pfMonedaId ? Number(pfMonedaId) : null,
        categoria_id: pfCategoriaId ? Number(pfCategoriaId) : null
      };

      if (editingId) {
        await actualizarPortafolio(editingId, payload);
        setMessage("Portafolio actualizado");
      } else {
        await crearPortafolio(payload);
        setMessage("Portafolio creado");
      }

      setEditingId(null);
      clearPortafolioForm();
      setShowPortafolioForm(false);
      await loadDashboardData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(portafolio) {
    setEditingId(portafolio.id);
    setPfNombre(portafolio.nombre || "");
    setPfMonedaId(portafolio.moneda_id ? String(portafolio.moneda_id) : "");
    setPfCategoriaId(portafolio.categoria_id ? String(portafolio.categoria_id) : "");
    setShowPortafolioForm(true);
  }

  async function handleDelete(id) {
    if (!usuario) return;
    const confirmed = window.confirm(
      "Se eliminaran todas las posiciones del portafolio. Deseas continuar?"
    );
    if (!confirmed) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await eliminarPortafolio(id);
      setMessage("Portafolio eliminado");
      if (editingId === id) {
        setEditingId(null);
        clearPortafolioForm();
        setShowPortafolioForm(false);
      }
      if (selectedPortafolio && selectedPortafolio.id === id) {
        setSelectedPortafolio(null);
        setPosiciones([]);
        setOrdenes([]);
        setExpandedOrdenId(null);
        setResumenPosiciones(null);
        setPosicionesEvolutionKeys([]);
        setPosicionesEvolutionSeries([]);
        setSelectedPosicionChartKey("");
        setVisiblePosicionChartKeys([]);
        setPosicionesRentabilidadSeries([]);
        clearOrdenForm();
      }
      await loadDashboardData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function importActivoPorTicker(
    rawTicker,
    { silent = false, setOrderFields = true, categoriaId = null } = {}
  ) {
    const symbol = String(rawTicker || "").trim().toUpperCase();
    if (!symbol) {
      throw new Error("Escribe un ticker para buscar en Yahoo Finance");
    }

    const activo = await importarActivoDesdeYahoo({
      symbol,
      categoria_id:
        categoriaId !== null
          ? Number(categoriaId)
          : selectedPortafolio?.categoria_id
            ? Number(selectedPortafolio.categoria_id)
            : null
    });

    if (!activo?.id) {
      throw new Error("No se pudo importar el activo desde Yahoo Finance");
    }

    setActivos((prev) => {
      const index = prev.findIndex((item) => Number(item.id) === Number(activo.id));
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...activo };
        return next;
      }
      return [...prev, activo];
    });
    if (setOrderFields) {
      setOrdenActivoId(String(activo.id));
      setOrdenActivoTicker(activo.ticker || symbol);
    }

    if (!silent) {
      setMessage(activo.message || `Activo ${symbol} listo para usar`);
    }

    return Number(activo.id);
  }

  async function handleImportActivoDesdeYahoo() {
    if (!selectedPortafolio) return;

    setLoadingActivoYahoo(true);
    setError("");
    setMessage("");
    try {
      await importActivoPorTicker(ordenActivoTicker);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivoYahoo(false);
    }
  }

  async function handleDeleteOrden(ordenId) {
    if (!selectedPortafolio || !usuario) return;
    const confirmed = window.confirm("Se eliminara la orden seleccionada. Deseas continuar?");
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await eliminarOrden(ordenId);
      setMessage("Orden eliminada");
      await loadPosiciones(selectedPortafolio);
      await loadDashboardData(usuario, { silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrdenSubmit(event) {
    event.preventDefault();
    if (!selectedPortafolio) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payloadBase = {
        cantidad: Number(ordenCantidad || 0),
        precio: Number(ordenPrecio || 0),
        comision: Number(ordenComision || 0),
        observacion: ordenObservacion.trim() || null
      };

      if (ordenTipo === "compra") {
        let posicionId = Number(ordenPosicionId || 0);

        if (!posicionId) {
          let activoId = Number(ordenActivoId || 0);
          if (!activoId && ordenActivoTicker.trim()) {
            activoId = await importActivoPorTicker(ordenActivoTicker, { silent: true });
          }
          if (!activoId) {
            throw new Error("Selecciona un activo o escribe un ticker para la compra");
          }

          const posicionExistente = posiciones.find((p) => Number(p.activo_id) === activoId);
          if (posicionExistente) {
            posicionId = posicionExistente.id;
          } else {
            const nuevaPosicion = await crearPosicion({
              portafolio_id: selectedPortafolio.id,
              activo_id: activoId,
              cantidad: 0,
              preciopromedio: 0
            });
            posicionId = nuevaPosicion.id;
          }
        }

        await ejecutarOrdenCompra({
          posicion_id: posicionId,
          ...payloadBase
        });
        setMessage("Orden de compra ejecutada");
      } else {
        const posicionId = Number(ordenPosicionId || 0);
        if (!posicionId) {
          throw new Error("Selecciona una posicion para la venta");
        }

        await ejecutarOrdenVenta({
          posicion_id: posicionId,
          ...payloadBase
        });
        setMessage("Orden de venta ejecutada");
      }

      clearOrdenForm();
      await loadPosiciones(selectedPortafolio);
      if (usuario) {
        await loadDashboardData(usuario, { silent: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getResumenPesoInputValue(resumen) {
    if (Object.prototype.hasOwnProperty.call(resumenPesoDrafts, resumen.id)) {
      return resumenPesoDrafts[resumen.id];
    }
    return String(Number(resumen.pesoObjetivo || 0).toFixed(2));
  }

  function handleResumenPesoDraftChange(resumenId, value) {
    setResumenPesoDrafts((prev) => ({
      ...prev,
      [resumenId]: value
    }));
  }

  function resetResumenPesoDraft(resumen) {
    setResumenPesoDrafts((prev) => {
      const next = { ...prev };
      delete next[resumen.id];
      return next;
    });
  }

  async function commitResumenPesoObjetivo(resumen) {
    if (!usuario || !resumen) return;
    const rawValue = getResumenPesoInputValue(resumen);
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("El peso objetivo debe ser un numero mayor o igual a 0.");
      resetResumenPesoDraft(resumen);
      return;
    }
    const current = Number(resumen.pesoObjetivo || 0);
    if (Math.abs(parsed - current) < 0.0000001) {
      resetResumenPesoDraft(resumen);
      return;
    }

    setError("");
    setMessage("");
    setSavingResumenId(resumen.id);
    try {
      await actualizarResumenPeso(resumen.id, parsed);
      setMessage("Peso objetivo actualizado");
      resetResumenPesoDraft(resumen);
      await loadDashboardData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingResumenId(null);
    }
  }

  function startEditCashFlow(cashFlow) {
    const categoriaNormalizada = String(cashFlow.categoria || "").trim().toLowerCase();
    setShowCashFlowForm(true);
    setEditingCashFlowId(cashFlow.id);
    setCashFlowTipo(cashFlow.tipo || "ingreso");
    setCashFlowCategoria(
      CASHFLOW_CATEGORIAS.includes(categoriaNormalizada) ? categoriaNormalizada : "otros"
    );
    setCashFlowMonedaId(
      cashFlow.moneda_id ? String(cashFlow.moneda_id) : usuario?.moneda_id ? String(usuario.moneda_id) : ""
    );
    setCashFlowNombre(cashFlow.nombre || "");
    setCashFlowFecha(cashFlow.fecha ? String(cashFlow.fecha).slice(0, 10) : "");
    setCashFlowAporte(String(cashFlow.aporte ?? ""));
    setCashFlowObservacion(cashFlow.observacion || "");
  }

  async function handleCashFlowSubmit(event) {
    event.preventDefault();
    if (!usuario) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        usuario_id: usuario.id,
        tipo: cashFlowTipo,
        categoria: cashFlowCategoria || "otros",
        moneda_id: cashFlowMonedaId ? Number(cashFlowMonedaId) : null,
        nombre: cashFlowNombre.trim(),
        fecha: cashFlowFecha,
        aporte: Number(cashFlowAporte || 0),
        observacion: cashFlowObservacion.trim() || null
      };

      if (editingCashFlowId) {
        await actualizarCashFlow(editingCashFlowId, payload);
        setMessage("Cashflow actualizado");
      } else {
        await crearCashFlow(payload);
        setMessage("Cashflow creado");
      }

      clearCashFlowForm();
      await loadCashFlowData(usuario);
      await loadDashboardData(usuario, { silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCashFlow(id) {
    if (!usuario) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await eliminarCashFlow(id);
      if (editingCashFlowId === id) clearCashFlowForm();
      setMessage("Cashflow eliminado");
      await loadCashFlowData(usuario);
      await loadDashboardData(usuario, { silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSnapshotConfig(overrides = {}) {
    const enabledValue =
      typeof overrides.enabled === "boolean" ? overrides.enabled : snapshotConfigEnabled;
    const intervalValue = String(overrides.interval ?? snapshotIntervalPortafolio);
    if (!usuario) return false;

    const interval = Number(intervalValue || 0);
    if (!Number.isInteger(interval) || interval < 5) {
      setError("El intervalo de snapshots debe ser un entero >= 5 minutos.");
      return false;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await updateSnapshotConfigByUsuario(usuario.id, {
        enabled: enabledValue,
        interval_portafolio_minutes: interval,
        interval_posicion_minutes: interval
      });
      const resolvedInterval = String(
        res?.interval_portafolio_minutes ?? res?.interval_posicion_minutes ?? interval
      );
      setSnapshotConfigEnabled(Boolean(res?.enabled));
      setSnapshotIntervalPortafolio(resolvedInterval);
      setSnapshotIntervalPosicion(resolvedInterval);
      setSettingsAutoSaveMessage("Configuracion de snapshots guardada");
      setMessage(res?.message || "Configuracion de snapshots actualizada");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMonedaUsuario(monedaId) {
    if (!usuario || !monedaId) return false;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await actualizarUsuario(usuario.id, {
        nombre: usuario.nombre,
        moneda_id: Number(monedaId)
      });
      const updatedUsuario = {
        ...usuario,
        moneda_id: Number(monedaId)
      };
      setUsuario(updatedUsuario);
      localStorage.setItem("usuario", JSON.stringify(updatedUsuario));
      setSettingsAutoSaveMessage("Moneda de usuario guardada");
      setMessage(res?.message || "Moneda actualizada");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllNotificacionesRead() {
    if (!usuario) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await markAllNotificacionesRead(usuario.id);
      setMessage(res?.message || "Notificaciones marcadas como leidas");
      await loadNotificacionesData(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkNotificacionRead(id) {
    if (!usuario) return;
    try {
      await markNotificacionRead(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: 1, read_at: new Date().toISOString() } : n))
      );
      setUnreadNotificaciones((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDismissAllNotificaciones() {
    if (!usuario) return;
    const confirmed = window.confirm("Se descartaran todas las notificaciones visibles. Continuar?");
    if (!confirmed) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await eliminarTodasNotificacionesUsuario(usuario.id);
      setNotificaciones([]);
      setUnreadNotificaciones(0);
      setMessage("Notificaciones eliminadas");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerarSnapshotManual() {
    if (!snapshotPortafolioId) return;

    setLoadingSnapshots(true);
    setError("");
    setMessage("");
    try {
      const portafolioId = Number(snapshotPortafolioId);
      const snapshotTimestamp = new Date().toISOString();
      await Promise.all([
        generarSnapshotPortafolio(portafolioId, snapshotTimestamp),
        generarSnapshotsPosicionesPortafolio(portafolioId, snapshotTimestamp)
      ]);
      await loadSnapshotsData();
      setMessage("Snapshot manual generado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSnapshots(false);
    }
  }

  async function handleGenerarSnapshotsTodos() {
    if (!portafolios.length) return;

    setLoadingSnapshots(true);
    setError("");
    setMessage("");
    try {
      const snapshotTimestamp = new Date().toISOString();
      await Promise.all([
        generarSnapshotsTodosPortafolios(snapshotTimestamp),
        ...portafolios.map((portafolio) =>
          generarSnapshotsPosicionesPortafolio(Number(portafolio.id), snapshotTimestamp)
        )
      ]);
      await loadSnapshotsData();
      setMessage(`Snapshots generadas para ${portafolios.length} portafolio(s)`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSnapshots(false);
    }
  }

  async function handleEliminarSnapshotPortafolio(snapshot) {
    if (!snapshot?.id) return;
    const confirmed = window.confirm(
      "Se eliminara esta snapshot de portafolio. Deseas continuar?"
    );
    if (!confirmed) return;

    setLoadingSnapshots(true);
    setError("");
    setMessage("");
    try {
      await eliminarPortfolioSnapshot(snapshot.id);
      await loadSnapshotsData();
      setMessage("Snapshot eliminada");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSnapshots(false);
    }
  }

  const portfolioSnapshotsAsc = [...portfolioSnapshots].sort((a, b) =>
    String(a.fecha || "").localeCompare(String(b.fecha || ""))
  );
  const firstPortfolioSnapshot = portfolioSnapshotsAsc[0] || null;
  const lastPortfolioSnapshot = portfolioSnapshotsAsc[portfolioSnapshotsAsc.length - 1] || null;
  const portfolioVariacion =
    firstPortfolioSnapshot && lastPortfolioSnapshot
      ? Number(lastPortfolioSnapshot.valor || 0) - Number(firstPortfolioSnapshot.valor || 0)
      : 0;
  const portfolioVariacionPct =
    firstPortfolioSnapshot && Number(firstPortfolioSnapshot.valor || 0) !== 0
      ? (portfolioVariacion / Number(firstPortfolioSnapshot.valor || 0)) * 100
      : 0;
  const sortedPortfolioSnapshots = portfolioSnapshots
    .slice()
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
  const sortedPosiciones = posiciones.slice().sort((a, b) => {
    const direction = posicionesSort.direction === "asc" ? 1 : -1;
    const numericKeys = ["variacion_diaria", "precio_actual", "valor_total", "rentabilidad"];
    if (numericKeys.includes(posicionesSort.key)) {
      return (Number(a[posicionesSort.key] || 0) - Number(b[posicionesSort.key] || 0)) * direction;
    }
    const valueA = String(a?.[posicionesSort.key] || "");
    const valueB = String(b?.[posicionesSort.key] || "");
    return valueA.localeCompare(valueB, "es", { sensitivity: "base" }) * direction;
  });
  const sortedPosicionSnapshots = posicionSnapshots
    .slice()
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
  const snapshotDateKey = (value) => String(value || "").slice(0, 10);
  const snapshotDateTimeKey = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
    const normalized = raw.replace("T", " ").replace("Z", "").slice(0, 19);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return `${normalized} 00:00:00`;
    return normalized;
  };
  const posicionSnapshotsByDateTime = sortedPosicionSnapshots.reduce((acc, snapshot) => {
    const key = snapshotDateTimeKey(snapshot.fecha);
    if (!acc[key]) acc[key] = [];
    acc[key].push(snapshot);
    return acc;
  }, {});
  const visiblePosiciones = sortedPosiciones.filter((posicion) => Number(posicion.cantidad || 0) > 0);
  const activePosiciones = posiciones.filter((posicion) => Number(posicion.cantidad || 0) > 0);
  const portfolioValorActual = activePosiciones.reduce(
    (sum, posicion) => sum + Number(posicion?.valor_total || 0),
    0
  );
  const portfolioInversionResumenFormula = ordenes.reduce((sum, orden) => {
    const tipo = String(orden?.tipo || "").trim().toLowerCase();
    const cantidad = Number(orden?.cantidad || 0);
    const precio = Number(orden?.precio || 0);
    const comision = Number(orden?.comision || 0);
    if (!Number.isFinite(cantidad) || !Number.isFinite(precio) || cantidad <= 0 || precio < 0) {
      return sum;
    }
    if (tipo === "compra") {
      return sum + cantidad * precio + (Number.isFinite(comision) ? comision : 0);
    }
    if (tipo === "venta") {
      return sum - (cantidad * precio - (Number.isFinite(comision) ? comision : 0));
    }
    return sum;
  }, 0);
  const selectedResumenCategoria = resumenes.find(
    (resumen) =>
      Number(resumen?.categoria_id || 0) > 0 &&
      Number(resumen?.categoria_id || 0) === Number(selectedPortafolio?.categoria_id || 0)
  );
  const portfolioRentabilidadPct = (() => {
    const categoriaNombre = String(selectedResumenCategoria?.categoria_nombre || "")
      .trim()
      .toLowerCase();
    if (categoriaNombre === "liquidez") return 0;
    const totalCategoria = Number(selectedResumenCategoria?.totalCategoriaMoneda);
    const inversionCategoria = Number(selectedResumenCategoria?.inversionInicial);
    if (
      Number.isFinite(totalCategoria) &&
      Number.isFinite(inversionCategoria) &&
      inversionCategoria !== 0
    ) {
      return ((totalCategoria - inversionCategoria) / inversionCategoria) * 100;
    }
    return portfolioInversionResumenFormula !== 0
      ? ((portfolioValorActual - portfolioInversionResumenFormula) / portfolioInversionResumenFormula) *
          100
      : 0;
  })();
  const posicionesPesoDataRaw = activePosiciones
    .map((posicion) => ({
      nombre: posicion?.activo_nombre || posicion?.ticker || `Posicion ${posicion?.id || ""}`,
      valor: Number(posicion?.valor_total || 0)
    }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const posicionesPesoData = (() => {
    const top = posicionesPesoDataRaw.slice(0, 7);
    const othersValue = posicionesPesoDataRaw
      .slice(7)
      .reduce((sum, item) => sum + Number(item?.valor || 0), 0);
    if (othersValue > 0) {
      top.push({
        nombre: "Otros",
        valor: othersValue
      });
    }
    return top;
  })();
  const posicionesPesoTotal = posicionesPesoData.reduce((sum, item) => sum + Number(item?.valor || 0), 0);
  const posicionesSectorPesoDataRaw = Object.entries(
    activePosiciones
      .filter((posicion) => Number(posicion?.valor_total || 0) > 0)
      .reduce((acc, posicion) => {
        const sector = String(posicion?.sector_nombre || "").trim() || "Sin sector";
        acc[sector] = Number(acc[sector] || 0) + Number(posicion?.valor_total || 0);
        return acc;
      }, {})
  )
    .map(([nombre, valor]) => ({ nombre, valor: Number(valor || 0) }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const posicionesSectorPesoData = (() => {
    const top = posicionesSectorPesoDataRaw.slice(0, 7);
    const othersValue = posicionesSectorPesoDataRaw
      .slice(7)
      .reduce((sum, item) => sum + Number(item?.valor || 0), 0);
    if (othersValue > 0) {
      top.push({ nombre: "Otros", valor: othersValue });
    }
    return top;
  })();
  const posicionesSectorPesoTotal = posicionesSectorPesoData.reduce(
    (sum, item) => sum + Number(item?.valor || 0),
    0
  );
  const posicionesPesoChartData =
    posicionesPesoChartMode === "sector" ? posicionesSectorPesoData : posicionesPesoData;
  const posicionesPesoChartTotal =
    posicionesPesoChartMode === "sector" ? posicionesSectorPesoTotal : posicionesPesoTotal;
  const expandedPosicion =
    visiblePosiciones.find((posicion) => String(posicion.id) === String(expandedPosicionId)) || null;
  const expandedPosicionActivo = expandedPosicion
    ? activos.find((activo) => String(activo.id) === String(expandedPosicion.activo_id)) || null
    : null;
  const expandedPosicionIconSrc = expandedPosicionActivo
    ? resolveAssetIconSrc(expandedPosicionActivo, detalleFondoPosicion)
    : expandedPosicion
      ? resolvePosicionLogoSrc(expandedPosicion)
      : null;
  const monedaResumenTicker =
    monedas.find((moneda) => String(moneda.id) === String(usuario?.moneda_id))?.ticker ||
    resumenes.find((resumen) => resumen.moneda_ticker)?.moneda_ticker ||
    "Moneda";
  const totalResumenMoneda = resumenes.reduce(
    (total, resumen) => total + Number(resumen.totalCategoriaMoneda || 0),
    0
  );
  const resumenesConMetricas = resumenes.map((resumen) => {
    const categoriaNombre = String(resumen.categoria_nombre || "").trim().toLowerCase();
    const isLiquidez = categoriaNombre === "liquidez";
    const totalCategoriaMoneda = Number(resumen.totalCategoriaMoneda || 0);
    const inversionInicial = Number(resumen.inversionInicial || 0);
    const diferenciaRentabilidad = isLiquidez ? 0 : totalCategoriaMoneda - inversionInicial;
    const pesoObjetivo = Number(resumen.pesoObjetivo || 0);
    const rentabilidad = isLiquidez
      ? 0
      : inversionInicial !== 0
        ? ((totalCategoriaMoneda - inversionInicial) / inversionInicial) * 100
        : 0;
    const peso = totalResumenMoneda !== 0 ? (totalCategoriaMoneda / totalResumenMoneda) * 100 : 0;
    const diferenciaPeso = pesoObjetivo - peso;
    const ajusteImporte = (diferenciaPeso / 100) * totalResumenMoneda;
    const accionAjuste =
      diferenciaPeso > 0.0001
        ? "Comprar"
        : diferenciaPeso < -0.0001
          ? "Vender"
          : "Sin cambios";
    const tooltipPeso =
      accionAjuste === "Sin cambios"
        ? "Peso alineado con el objetivo."
        : `${accionAjuste}: ${Math.abs(diferenciaPeso).toFixed(2)} pp (~${Math.abs(ajusteImporte).toFixed(2)} ${monedaResumenTicker})`;
    const tooltipRentabilidad = isLiquidez
      ? "Rentabilidad fija para liquidez (0%)"
      : `Diferencia: ${
          diferenciaRentabilidad >= 0 ? "+" : ""
        }${diferenciaRentabilidad.toFixed(2)} ${monedaResumenTicker}`;
    return {
      ...resumen,
      totalCategoriaMoneda,
      rentabilidad,
      peso,
      tooltipPeso,
      tooltipRentabilidad
    };
  });
  const totalInversionInicialResumen = resumenesConMetricas.reduce(
    (total, resumen) => total + Number(resumen.inversionInicial || 0),
    0
  );
  const totalPesoObjetivoResumen = resumenesConMetricas.reduce(
    (total, resumen) => total + Number(resumen.pesoObjetivo || 0),
    0
  );
  const totalRentabilidadResumen =
    totalInversionInicialResumen !== 0
      ? ((totalResumenMoneda - totalInversionInicialResumen) / totalInversionInicialResumen) * 100
      : 0;
  const resumenPieDataRaw = resumenesConMetricas
    .filter((resumen) => Number(resumen.totalCategoriaMoneda || 0) > 0)
    .map((resumen) => ({
      categoria: resumen.categoria_nombre || "-",
      valor: Number(resumen.totalCategoriaMoneda || 0),
      peso: Number(resumen.peso || 0)
    }))
    .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0));
  const resumenPieData = (() => {
    const top = resumenPieDataRaw.slice(0, 7);
    const othersValue = resumenPieDataRaw
      .slice(7)
      .reduce((sum, item) => sum + Number(item?.valor || 0), 0);
    if (othersValue > 0) {
      top.push({
        categoria: "Otros",
        valor: othersValue,
        peso: 0
      });
    }
    return top;
  })();
  const resumenPieTotal = resumenPieData.reduce((sum, item) => sum + Number(item?.valor || 0), 0);
  const cashFlowCurrencyTicker = cashFlowResumen?.moneda_ticker || monedaResumenTicker || "";
  const cashFlowCalendarNow = new Date();
  const cashFlowCalendarYear = cashFlowCalendarCursor.getFullYear();
  const cashFlowCalendarMonth = cashFlowCalendarCursor.getMonth();
  const cashFlowCalendarMonthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(new Date(cashFlowCalendarYear, cashFlowCalendarMonth, 1));
  const cashFlowCalendarDaysInMonth = new Date(
    cashFlowCalendarYear,
    cashFlowCalendarMonth + 1,
    0
  ).getDate();
  const cashFlowCalendarFirstWeekday =
    (new Date(cashFlowCalendarYear, cashFlowCalendarMonth, 1).getDay() + 6) % 7;
  const cashFlowCalendarDaySignals = cashFlows.reduce((acc, cashFlow) => {
    const rawDate = String(cashFlow.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return acc;
    const year = Number(rawDate.slice(0, 4));
    const month = Number(rawDate.slice(5, 7));
    const day = Number(rawDate.slice(8, 10));
    if (
      year !== cashFlowCalendarYear ||
      month !== cashFlowCalendarMonth + 1 ||
      day < 1 ||
      day > cashFlowCalendarDaysInMonth
    ) {
      return acc;
    }

    if (!acc[day]) {
      acc[day] = { hasIngreso: false, hasGasto: false };
    }

    const tipo = String(cashFlow.tipo || "").toLowerCase();
    if (tipo === "ingreso") acc[day].hasIngreso = true;
    if (tipo === "gasto") acc[day].hasGasto = true;
    return acc;
  }, {});
  const cashFlowCalendarCells = [
    ...Array.from({ length: cashFlowCalendarFirstWeekday }, () => null),
    ...Array.from({ length: cashFlowCalendarDaysInMonth }, (_, index) => index + 1)
  ];
  const cashFlowMovementsInCalendarMonth = cashFlows.filter((cashFlow) => {
    const rawDate = String(cashFlow.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return false;
    const year = Number(rawDate.slice(0, 4));
    const month = Number(rawDate.slice(5, 7));
    return year === cashFlowCalendarYear && month === cashFlowCalendarMonth + 1;
  });
  const getCashFlowConvertedAmount = (cashFlow) => {
    const converted = Number(cashFlow?.aporte_convertido);
    if (Number.isFinite(converted)) return converted;
    return Number(cashFlow?.aporte || 0);
  };
  const getCashFlowOriginalAmount = (cashFlow) => Number(cashFlow?.aporte || 0);
  const getCashFlowOriginalTicker = (cashFlow) => cashFlow?.moneda_ticker || monedaResumenTicker || "";
  const cashFlowMonthTotalIngresos = cashFlowMovementsInCalendarMonth
    .filter((cashFlow) => String(cashFlow.tipo || "").toLowerCase() === "ingreso")
    .reduce((acc, cashFlow) => acc + getCashFlowConvertedAmount(cashFlow), 0);
  const cashFlowMonthTotalGastos = cashFlowMovementsInCalendarMonth
    .filter((cashFlow) => String(cashFlow.tipo || "").toLowerCase() === "gasto")
    .reduce((acc, cashFlow) => acc + getCashFlowConvertedAmount(cashFlow), 0);
  const cashFlowCategoriasIngresosMes = Object.entries(
    cashFlowMovementsInCalendarMonth
      .filter((cashFlow) => String(cashFlow.tipo || "").toLowerCase() === "ingreso")
      .reduce((acc, cashFlow) => {
        const categoria = String(cashFlow.categoria || "otros").trim().toLowerCase() || "otros";
        acc[categoria] = Number(acc[categoria] || 0) + getCashFlowConvertedAmount(cashFlow);
        return acc;
      }, {})
  )
    .map(([categoria, valor]) => ({
      categoria: formatCashFlowCategoria(categoria),
      valor: Number(valor || 0)
    }))
    .sort((a, b) => b.valor - a.valor);
  const cashFlowCategoriasGastosMes = Object.entries(
    cashFlowMovementsInCalendarMonth
      .filter((cashFlow) => String(cashFlow.tipo || "").toLowerCase() === "gasto")
      .reduce((acc, cashFlow) => {
        const categoria = String(cashFlow.categoria || "otros").trim().toLowerCase() || "otros";
        acc[categoria] = Number(acc[categoria] || 0) + getCashFlowConvertedAmount(cashFlow);
        return acc;
      }, {})
  )
    .map(([categoria, valor]) => ({
      categoria: formatCashFlowCategoria(categoria),
      valor: Number(valor || 0)
    }))
    .sort((a, b) => b.valor - a.valor);
  const cashFlowCategoriasIngresosMesTotal = cashFlowCategoriasIngresosMes.reduce(
    (sum, item) => sum + Number(item?.valor || 0),
    0
  );
  const cashFlowCategoriasGastosMesTotal = cashFlowCategoriasGastosMes.reduce(
    (sum, item) => sum + Number(item?.valor || 0),
    0
  );
  const cashFlowMensualAnualData = Array.from({ length: 12 }, (_, monthIndex) => ({
    mes: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(
      new Date(cashFlowCalendarYear, monthIndex, 1)
    ),
    ingresos: 0,
    gastos: 0
  }));
  for (const cashFlow of cashFlows) {
    const rawDate = String(cashFlow.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) continue;
    const year = Number(rawDate.slice(0, 4));
    if (year !== cashFlowCalendarYear) continue;
    const month = Number(rawDate.slice(5, 7));
    if (!Number.isInteger(month) || month < 1 || month > 12) continue;
    const amount = getCashFlowConvertedAmount(cashFlow);
    if (String(cashFlow.tipo || "").toLowerCase() === "ingreso") {
      cashFlowMensualAnualData[month - 1].ingresos += amount;
    } else if (String(cashFlow.tipo || "").toLowerCase() === "gasto") {
      cashFlowMensualAnualData[month - 1].gastos += amount;
    }
  }
  const cashFlowSaldoNetoEvolutionData = [];
  const cashFlowDailyNet = cashFlows
    .slice()
    .sort((a, b) => {
      const da = String(a.fecha || "");
      const db = String(b.fecha || "");
      const byDate = da.localeCompare(db);
      if (byDate !== 0) return byDate;
      return Number(a.id || 0) - Number(b.id || 0);
    })
    .reduce((acc, cashFlow) => {
      const dateKey = String(cashFlow.fecha || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return acc;
      const signedAmount =
        String(cashFlow.tipo || "").toLowerCase() === "gasto"
          ? -getCashFlowConvertedAmount(cashFlow)
          : getCashFlowConvertedAmount(cashFlow);
      acc[dateKey] = Number(acc[dateKey] || 0) + signedAmount;
      return acc;
    }, {});
  let runningSaldoNeto = 0;
  for (const dateKey of Object.keys(cashFlowDailyNet).sort((a, b) => a.localeCompare(b))) {
    runningSaldoNeto += Number(cashFlowDailyNet[dateKey] || 0);
    cashFlowSaldoNetoEvolutionData.push({
      fecha: dateKey,
      saldo: runningSaldoNeto
    });
  }
  const selectedCashFlowDayMovements = cashFlowSelectedDate
    ? cashFlows.filter((cashFlow) => String(cashFlow.fecha || "").slice(0, 10) === cashFlowSelectedDate)
    : [];
  const selectedCashFlowMonthTypeMovements = cashFlowSelectedMonthType
    ? cashFlowMovementsInCalendarMonth.filter(
        (cashFlow) => String(cashFlow.tipo || "").toLowerCase() === cashFlowSelectedMonthType
      )
    : [];
  const sortedOrdenes = ordenes
    .slice()
    .sort((a, b) => {
      const dateA = String(a.fecha || "");
      const dateB = String(b.fecha || "");
      const byDate = dateB.localeCompare(dateA);
      if (byDate !== 0) return byDate;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  const sortedCashFlows = cashFlows
    .slice()
    .sort((a, b) => {
      const dateA = String(a.fecha || "");
      const dateB = String(b.fecha || "");
      const byDate = dateB.localeCompare(dateA);
      if (byDate !== 0) return byDate;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  const sortedNotificaciones = notificaciones
    .slice()
    .sort((a, b) => {
      const dateA = String(a.created_at || "");
      const dateB = String(b.created_at || "");
      const byDate = dateB.localeCompare(dateA);
      if (byDate !== 0) return byDate;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  const totalPortafoliosPages = Math.max(1, Math.ceil(portafolios.length / LIST_PAGE_SIZE));
  const totalOrdenesPages = Math.max(1, Math.ceil(sortedOrdenes.length / LIST_PAGE_SIZE));
  const totalMovimientosPages = Math.max(1, Math.ceil(sortedCashFlows.length / LIST_PAGE_SIZE));
  const totalSnapshotsPages = Math.max(
    1,
    Math.ceil(sortedPortfolioSnapshots.length / LIST_PAGE_SIZE)
  );
  const totalNotificacionesPages = Math.max(
    1,
    Math.ceil(sortedNotificaciones.length / LIST_PAGE_SIZE)
  );
  const currentPortafoliosPage = Math.min(portafoliosPage, totalPortafoliosPages);
  const currentOrdenesPage = Math.min(ordenesPage, totalOrdenesPages);
  const currentMovimientosPage = Math.min(movimientosPage, totalMovimientosPages);
  const currentSnapshotsPage = Math.min(snapshotsPage, totalSnapshotsPages);
  const currentNotificacionesPage = Math.min(notificacionesPage, totalNotificacionesPages);
  const pagedPortafolios = portafolios.slice(
    (currentPortafoliosPage - 1) * LIST_PAGE_SIZE,
    currentPortafoliosPage * LIST_PAGE_SIZE
  );
  const pagedOrdenes = sortedOrdenes.slice(
    (currentOrdenesPage - 1) * LIST_PAGE_SIZE,
    currentOrdenesPage * LIST_PAGE_SIZE
  );
  const pagedMovimientos = sortedCashFlows.slice(
    (currentMovimientosPage - 1) * LIST_PAGE_SIZE,
    currentMovimientosPage * LIST_PAGE_SIZE
  );
  const pagedSnapshots = sortedPortfolioSnapshots.slice(
    (currentSnapshotsPage - 1) * LIST_PAGE_SIZE,
    currentSnapshotsPage * LIST_PAGE_SIZE
  );
  const pagedNotificaciones = sortedNotificaciones.slice(
    (currentNotificacionesPage - 1) * LIST_PAGE_SIZE,
    currentNotificacionesPage * LIST_PAGE_SIZE
  );
  const selectedCashFlowDayLabel = /^\d{4}-\d{2}-\d{2}$/.test(cashFlowSelectedDate)
    ? `${cashFlowSelectedDate.slice(8, 10)}/${cashFlowSelectedDate.slice(5, 7)}/${cashFlowSelectedDate.slice(0, 4)}`
    : cashFlowSelectedDate;
  const toastNotifications = [
    message
      ? {
          id: "message",
          text: message,
          tone: "success"
        }
      : null,
    settingsAutoSaveMessage
      ? {
          id: "autosave",
          text: settingsAutoSaveMessage,
          tone: "info"
        }
      : null
  ].filter(Boolean);

  function buildCashFlowDateKey(year, monthIndex, day) {
    const y = String(year);
    const m = String(monthIndex + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function handleCashFlowCalendarMonthChange(delta) {
    setCashFlowCalendarCursor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
    setCashFlowSelectedDate("");
    setCashFlowSelectedMonthType("");
  }

  function handleCashFlowCalendarDayClick(day) {
    const dateKey = buildCashFlowDateKey(cashFlowCalendarYear, cashFlowCalendarMonth, day);
    setCashFlowSelectedMonthType("");
    setCashFlowSelectedDate((prev) => (prev === dateKey ? "" : dateKey));
  }

  function handleCashFlowMonthTypeClick(tipo) {
    setCashFlowSelectedDate("");
    setCashFlowSelectedMonthType((prev) => (prev === tipo ? "" : tipo));
  }

  function getNextSortState(currentSort, key, defaultDirection = "asc") {
    if (currentSort.key === key) {
      return {
        key,
        direction: currentSort.direction === "asc" ? "desc" : "asc"
      };
    }
    return {
      key,
      direction: defaultDirection
    };
  }

  function getSortIndicator(currentSort, key) {
    if (currentSort.key !== key) return "<>";
    return currentSort.direction === "asc" ? "^" : "v";
  }

  function handleInicioPortfolioLegendClick(entry) {
    const key = String(entry?.dataKey || "");
    if (!key.startsWith("pf_")) return;
    setHiddenInicioPortfolioKeys((prev) => ({
      ...prev,
      [key]: !Boolean(prev[key])
    }));
  }

  function handleAddPosicionLine() {
    const key = String(selectedPosicionChartKey || "").trim();
    if (!key) return;
    setVisiblePosicionChartKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }

  function handleRemovePosicionLine(keyToRemove) {
    const key = String(keyToRemove || "").trim();
    if (!key) return;
    setVisiblePosicionChartKeys((prev) => prev.filter((keyItem) => keyItem !== key));
  }

  function renderPagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return null;
    return (
      <div className="paginationRow">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={`page-${page}`}
            type="button"
            className={`buttonSecondary paginationButton${
              page === currentPage ? " paginationButtonActive" : ""
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    );
  }

  const inicioPortfolioMonthlySeries = buildMonthlySeriesLastPoint(inicioPortfolioSeries);
  const inicioRentabilidadMonthlySeries = buildMonthlySeriesLastPoint(inicioRentabilidadSeries);
  const posicionesEvolutionMonthlySeries = buildMonthlySeriesLastPoint(posicionesEvolutionSeries);
  const posicionesRentabilidadMonthlySeries = buildMonthlySeriesLastPoint(posicionesRentabilidadSeries);

  // ── Risk metrics (Sharpe, Sortino, Vol, MaxDD, Calmar, CAGR) ─────────────
  const riskMetrics = (() => {
    const rawSeries = inicioRentabilidadSeries;
    if (rawSeries.length < 3) return null;

    const series = rawSeries.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    const values = series.map((p) => Number(p.rentabilidad || 0) + 100); // index base 100

    // Detect actual average interval between snapshots in days
    const firstDate = new Date(series[0].fecha);
    const lastDate  = new Date(series[series.length - 1].fecha);
    const totalDays = Math.max(1, (lastDate - firstDate) / 86400000);
    const avgDaysBetween = totalDays / Math.max(1, series.length - 1);
    // Periods per year based on real interval (e.g. ~365 if daily, ~52 if weekly, ~12 if monthly)
    const periodsPerYear = 365 / avgDaysBetween;

    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push(values[i - 1] !== 0 ? (values[i] - values[i - 1]) / values[i - 1] : 0);
    }

    const n = returns.length;
    const mean = returns.reduce((s, r) => s + r, 0) / n;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    const downsideReturns = returns.filter((r) => r < 0);
    const downsideVariance = downsideReturns.length
      ? downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length
      : 0;
    const downsideDev = Math.sqrt(downsideVariance);

    // Annualize using actual frequency, not assuming daily
    const annualFactor = Math.sqrt(periodsPerYear);
    const annualVol = stddev * annualFactor * 100;
    const annualReturn = mean * periodsPerYear * 100;

    const sharpe = annualVol > 0 ? annualReturn / annualVol : 0;
    const sortino = downsideDev > 0 ? annualReturn / (downsideDev * annualFactor * 100) : 0;

    let peak = values[0];
    let maxDD = 0;
    for (const v of values) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? ((v - peak) / peak) * 100 : 0;
      if (dd < maxDD) maxDD = dd;
    }

    const calmar = maxDD !== 0 ? annualReturn / Math.abs(maxDD) : 0;

    // CAGR using actual elapsed time
    const firstVal = values[0];
    const lastVal  = values[values.length - 1];
    const years = totalDays / 365;
    const cagr = firstVal > 0 && years > 0
      ? (Math.pow(lastVal / firstVal, 1 / years) - 1) * 100
      : 0;

    const positive = returns.filter((r) => r > 0).length;
    const winRate = n > 0 ? (positive / n) * 100 : 0;

    // VaR 95% per period, scaled to daily equivalent for display
    const var95Daily = -(mean - 1.645 * stddev) * 100 / Math.sqrt(avgDaysBetween);

    // Pain Index (average of all drawdown magnitudes)
    let runningPeak = values[0];
    let totalDD = 0;
    for (const v of values) {
      if (v > runningPeak) runningPeak = v;
      totalDD += runningPeak > 0 ? Math.abs((v - runningPeak) / runningPeak) * 100 : 0;
    }
    const painIndex = values.length > 0 ? totalDD / values.length : 0;

    // Recovery factor = CAGR / |maxDD|
    const recoveryFactor = maxDD !== 0 ? cagr / Math.abs(maxDD) : 0;

    return {
      sharpe:      sharpe.toFixed(2),
      sortino:     sortino.toFixed(2),
      volatilidad: annualVol.toFixed(2),
      maxDrawdown: maxDD.toFixed(2),
      calmar:      calmar.toFixed(2),
      cagr:        cagr.toFixed(2),
      winRate:     winRate.toFixed(1),
      annualReturn: annualReturn.toFixed(2),
      var95:       var95Daily.toFixed(2),
      painIndex:   painIndex.toFixed(2),
      recoveryFactor: recoveryFactor.toFixed(2)
    };
  })();

  // ── Correlation matrix from posicion snapshots ────────────────────────────
  const correlationMatrix = (() => {
    const keys = posicionesEvolutionKeys.slice(0, 6);
    if (keys.length < 2 || posicionesEvolutionSeries.length < 4) return null;
    const series = posicionesEvolutionSeries;
    const returnsMap = {};
    for (const k of keys) {
      returnsMap[k.key] = [];
      for (let i = 1; i < series.length; i++) {
        const prev = Number(series[i - 1][k.key] || 0);
        const curr = Number(series[i][k.key] || 0);
        returnsMap[k.key].push(prev !== 0 ? (curr - prev) / prev : 0);
      }
    }
    function pearson(a, b) {
      const n = Math.min(a.length, b.length);
      if (n < 2) return 0;
      const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
      const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
      let num = 0, da2 = 0, db2 = 0;
      for (let i = 0; i < n; i++) {
        const da = a[i] - ma, db = b[i] - mb;
        num += da * db; da2 += da * da; db2 += db * db;
      }
      return da2 === 0 || db2 === 0 ? 0 : num / Math.sqrt(da2 * db2);
    }
    const matrix = keys.map((ki) =>
      keys.map((kj) => pearson(returnsMap[ki.key], returnsMap[kj.key]))
    );
    return { keys, matrix };
  })();

  // ── Heatmap data from active posiciones ──────────────────────────────────
  const heatmapData = (() => {
    const active = posiciones.filter((p) => Number(p.cantidad || 0) > 0 && Number(p.valor_total || 0) > 0);
    if (!active.length) return [];
    const total = active.reduce((s, p) => s + Number(p.valor_total || 0), 0);
    return active.map((p) => ({
      name: p.ticker || p.activo_nombre || "?",
      fullName: p.activo_nombre || p.ticker || "?",
      size: Number(p.valor_total || 0),
      peso: total > 0 ? ((Number(p.valor_total || 0) / total) * 100).toFixed(1) : "0",
      variacion: p.variacion_diaria != null ? Number(p.variacion_diaria)
                 : p.variacion_porcentual != null ? Number(p.variacion_porcentual)
                 : Number(p.rentabilidad ?? 0),
      variacionEsDiaria: p.variacion_diaria != null || p.variacion_porcentual != null
    }));
  })();

  // ── Scenario simulator ────────────────────────────────────────────────────
  const scenarioCategories = (() => {
    const cats = {};
    for (const p of posiciones) {
      if (Number(p.cantidad || 0) <= 0) continue;
      const cat = String(p.categoria_nombre || p.activo_categoria_nombre || p.categoria || "Otros").trim() || "Otros";
      if (!cats[cat]) cats[cat] = { valor: 0, positions: [] };
      cats[cat].valor += Number(p.valor_total || 0);
      cats[cat].positions.push(p);
    }
    return cats;
  })();
  const scenarioCurrentTotal = posiciones.filter((p) => Number(p.cantidad || 0) > 0).reduce((s, p) => s + Number(p.valor_total || 0), 0);
  // ── Beta multipliers per category (feature 2) ────────────────────────────
  const BETA_MULTIPLIERS = [
    { keys: ["tecnolog","tech","software","semicon"], beta: 1.5 },
    { keys: ["crypto","criptomoneda","bitcoin","blockchain"], beta: 2.5 },
    { keys: ["renta fija","bono","bond","deuda"], beta: 0.2 },
    { keys: ["real estate","inmobiliario","reits"], beta: 0.6 },
    { keys: ["liquidez","cash","monetario"], beta: 0.0 },
    { keys: ["materia prima","commodity","oro","gold"], beta: 0.4 },
    { keys: ["energía","energy","petroleo"], beta: 0.8 },
    { keys: ["consumo básico","utilities","farmaceut","healthcare"], beta: 0.6 },
  ];
  function getCategoryBeta(cat) {
    const k = (cat || "").toLowerCase();
    for (const entry of BETA_MULTIPLIERS) {
      if (entry.keys.some((key) => k.includes(key))) return entry.beta;
    }
    return 1.0;
  }

  const effectiveShocks = scenarioShocks;

  // ── Scenario result using effectiveShocks ────────────────────────────────
  const scenarioResultFinal = (() => {
    let total = 0;
    for (const p of posiciones) {
      if (Number(p.cantidad || 0) <= 0) continue;
      const shock = Number(effectiveShocks[String(p.id)] || 0) / 100;
      total += Number(p.valor_total || 0) * (1 + shock);
    }
    return total;
  })();

  // ── Preset historical scenarios (feature 1 + 15) ─────────────────────────
  const PRESET_SCENARIOS = [
    { label: "Crisis 2008", icon: "📉", description: "Crisis financiera global — S&P 500 -57%", shocks: { default: -50, "renta fija": -5, "bono": -5, "liquidez": 0, "cash": 0 } },
    { label: "COVID-19", icon: "🦠", description: "Pandemia 2020 — Caída rápida (-35%) y recuperación", shocks: { default: -35, "tecnolog": 25, "tech": 25, "farmaceut": 20, "salud": 20, "liquidez": 0 } },
    { label: "Punto-com", icon: "💻", description: "Burbuja tecnológica 2000 — Nasdaq -78%", shocks: { default: -25, "tecnolog": -78, "tech": -78, "software": -78, "semicon": -60 } },
    { label: "Corrección 2022", icon: "📊", description: "Subida de tipos — Tecnología y bonos caen", shocks: { default: -20, "tecnolog": -35, "tech": -35, "renta fija": -15, "bono": -15, "energía": 25, "energy": 25 } },
    { label: "Inflación extrema", icon: "🔥", description: "Escenario de hiperinflación — Activos reales ganan", shocks: { default: -30, "renta fija": -40, "bono": -40, "liquidez": -20, "oro": 50, "materia": 40, "real estate": 20, "inmobiliario": 20 } },
    { label: "Recesión moderada", icon: "📉", description: "Recesión suave — Caída controlada en renta variable", shocks: { default: -15, "renta fija": 10, "bono": 10, "liquidez": 0, "oro": 10 } },
  ];
  function applyRandomShock() {
    // Genera un escenario de mercado aleatorio con distribución realista
    const rand = Math.random();
    let marketShock;
    if (rand < 0.20) {
      // Bear market severo (20% probabilidad): -50 a -20
      marketShock = -(20 + Math.random() * 30);
    } else if (rand < 0.40) {
      // Corrección moderada (20%): -20 a -8
      marketShock = -(8 + Math.random() * 12);
    } else if (rand < 0.65) {
      // Mercado lateral (25%): -8 a +8
      marketShock = -8 + Math.random() * 16;
    } else if (rand < 0.85) {
      // Bull market moderado (20%): +8 a +20
      marketShock = 8 + Math.random() * 12;
    } else {
      // Bull market fuerte (15%): +20 a +40
      marketShock = 20 + Math.random() * 20;
    }
    marketShock = Math.round(marketShock * 10) / 10;
    // Añadir ruido idiosincrático pequeño por posición
    const newShocks = {};
    for (const p of posiciones) {
      if (Number(p.cantidad || 0) <= 0) continue;
      const cat = String(p.categoria_nombre || p.activo_categoria_nombre || p.categoria || "Otros");
      const beta = getCategoryBeta(cat);
      const noise = (Math.random() - 0.5) * 6; // ±3% de ruido idiosincrático
      const shock = Math.round((marketShock * beta + noise) * 10) / 10;
      newShocks[String(p.id)] = Math.max(-80, Math.min(80, shock));
    }
    setScenarioShocks(newShocks);
    setScenarioMode("position");
  }

  function applyPreset(preset) {
    const newShocks = {};
    const getShock = (key) => {
      const k = key.toLowerCase();
      for (const [shockKey, val] of Object.entries(preset.shocks)) {
        if (shockKey === "default") continue;
        if (k.includes(shockKey)) return val;
      }
      return preset.shocks.default ?? 0;
    };
    for (const p of posiciones) {
      if (Number(p.cantidad || 0) <= 0) continue;
      const cat = String(p.categoria_nombre || p.activo_categoria_nombre || p.categoria || "Otros");
      newShocks[String(p.id)] = getShock(cat);
    }
    setScenarioShocks(newShocks);
    setScenarioMode("position");
  }

  // ── Bar chart / waterfall / treemap / table data using effectiveShocks ────
  const scenarioBarData = posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => {
    const shock = Number(effectiveShocks[String(p.id)] || 0) / 100;
    const val = Number(p.valor_total || 0);
    return { name: (p.ticker || p.activo_nombre || "?").slice(0, 10), actual: Number(val.toFixed(2)), escenario: Number((val * (1 + shock)).toFixed(2)) };
  });

  const waterfallData = posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => {
    const shock = Number(effectiveShocks[String(p.id)] || 0) / 100;
    const val = Number(p.valor_total || 0);
    return { name: (p.ticker || p.activo_nombre || "?").slice(0, 10), delta: Number((val * shock).toFixed(2)) };
  }).sort((a, b) => a.delta - b.delta);

  const scenarioTreemapData = posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => ({
    name: (p.ticker || p.activo_nombre || "?").slice(0, 12),
    size: Number(p.valor_total || 0),
    shock: Number(effectiveShocks[String(p.id)] || 0),
  })).filter((i) => i.size > 0);

  const impactTableData = posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => {
    const shock = Number(effectiveShocks[String(p.id)] || 0) / 100;
    const val = Number(p.valor_total || 0);
    const newVal = val * (1 + shock);
    return { name: p.activo_nombre || p.ticker || "?", ticker: p.ticker || "-", actual: val, escenario: newVal, delta: newVal - val, shockPct: shock * 100 };
  }).sort((a, b) => a.delta - b.delta);

  // ── Dynamic VaR (feature 13) ──────────────────────────────────────────────
  const dynamicVar95 = scenarioResultFinal > 0 && riskMetrics
    ? scenarioResultFinal * (Number(riskMetrics.volatilidad) / 100) / Math.sqrt(252) * 1.645
    : null;

  // ── Inconsistency warnings (feature 14) ──────────────────────────────────
  const scenarioWarnings = (() => {
    const warnings = [];
    const shockValues = Object.values(effectiveShocks).map(Number);
    if (shockValues.length === 0) return warnings;
    // Check bond/equity combination
    const bondKeys = ["renta fija", "bono", "bond"];
    const equityKeys = ["renta variable", "accion", "etf"];
    let bondShock = null, equityShock = null;
    for (const [cat, shock] of Object.entries(effectiveShocks)) {
      const k = cat.toLowerCase();
      if (bondKeys.some((b) => k.includes(b))) bondShock = Number(shock);
      if (equityKeys.some((e) => k.includes(e))) equityShock = Number(shock);
    }
    if (bondShock !== null && equityShock !== null && bondShock > 15 && equityShock > 15) {
      warnings.push("Bonos y renta variable subiendo mucho simultáneamente es poco habitual. En mercados alcistas de equity, los bonos suelen mantenerse o bajar.");
    }
    if (bondShock !== null && bondShock > 20) {
      warnings.push("Una subida de bonos >20% implicaría una bajada drástica de tipos de interés, un escenario extremo.");
    }
    const cryptoShock = Object.entries(effectiveShocks).find(([k]) => k.toLowerCase().includes("crypto") || k.toLowerCase().includes("criptomoneda"));
    if (cryptoShock && Math.abs(Number(cryptoShock[1])) > 70) {
      warnings.push(`Shock en crypto de ${cryptoShock[1]}%: histórico pero posible (BTC cayó -84% en 2018 y +1000% en otros períodos).`);
    }
    return warnings;
  })();

  // ── Objectives impact (feature 10) ───────────────────────────────────────
  const objetivosImpact = objetivos.map((obj) => {
    const valorPortafolioActual = scenarioCurrentTotal;
    const valorEscenario = scenarioResultFinal;
    const target = Number(obj.monto_objetivo || 0);
    const progActual = target > 0 ? (valorPortafolioActual / target) * 100 : 0;
    const progEscenario = target > 0 ? (valorEscenario / target) * 100 : 0;
    return { ...obj, progActual, progEscenario, delta: progEscenario - progActual };
  });

  // ── Monte Carlo extendido con rutas anuales (features 3,7,8,9,11) ─────────
  const monteCarloData = (() => {
    if (!riskMetrics || scenarioCurrentTotal <= 0) return {};
    const baseReturn = mcRetornoOverride !== "" ? Number(mcRetornoOverride) : Number(riskMetrics.annualReturn);
    const mu = baseReturn / 100 + dividendYieldPct / 100;
    const sigma = Number(riskMetrics.volatilidad) / 100;
    const sigmaRebal = sigma * 0.88;
    const years = monteCarloYears;
    const runs = Math.min(monteCarloRuns, 1000);
    const dt = 1 / 12;
    const contrib = Number(monthlyContribution);
    const gauss = () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());

    function simulate(s0, sigmaToUse) {
      const yearlyVals = Array.from({ length: years + 1 }, () => []);
      yearlyVals[0] = Array(runs).fill(s0);
      const finals = [];
      for (let r = 0; r < runs; r++) {
        let v = s0;
        for (let y = 1; y <= years; y++) {
          for (let m = 0; m < 12; m++) {
            v = v * Math.exp((mu - 0.5 * sigmaToUse * sigmaToUse) * dt + sigmaToUse * Math.sqrt(dt) * gauss()) + contrib;
            if (v < 0) v = 0;
          }
          yearlyVals[y].push(v);
        }
        finals.push(v);
      }
      finals.sort((a, b) => a - b);
      const pct = (frac) => finals[Math.floor(runs * frac)] ?? finals[finals.length - 1];
      const data = yearlyVals.map((yv, yi) => {
        const sorted = [...yv].sort((a, b) => a - b);
        const p = (f) => sorted[Math.floor(runs * f)] ?? sorted[sorted.length - 1];
        return { year: `Año ${yi}`, p10: Number(p(0.10).toFixed(0)), p25: Number(p(0.25).toFixed(0)), p50: Number(p(0.50).toFixed(0)), p75: Number(p(0.75).toFixed(0)), p90: Number(p(0.90).toFixed(0)) };
      });
      const ruinCount = finals.filter((v) => v < s0 * (ruinThreshold / 100)).length;
      const ruinProb = (ruinCount / runs) * 100;
      return { data, finals, p10: pct(0.10), p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90), ruinProb };
    }

    const base = simulate(scenarioCurrentTotal, sigma);
    const rebal = showMcRebalancing ? simulate(scenarioCurrentTotal, sigmaRebal) : null;
    return { ...base, rebal };
  })();

  // ── Rebalanceo alerts ─────────────────────────────────────────────────────
  const REBALANCE_THRESHOLD = 5;
  const resumenesConAlerta = resumenesConMetricas.map((r) => ({
    ...r,
    needsRebalance: Math.abs(r.peso - Number(r.pesoObjetivo || 0)) > REBALANCE_THRESHOLD
  }));

  // ── Portafolios ordered by drag&drop ────────────────────────────────────
  const orderedPortafolios = portafoliosOrder.length
    ? portafoliosOrder
        .map((id) => portafolios.find((p) => p.id === id))
        .filter(Boolean)
    : portafolios;

  // ── Benchmark merged series for chart ────────────────────────────────────
  const inicioRentabilidadWithBenchmark = (() => {
    const base = inicioRentabilidadMonthlySeries;
    if (!showBenchmark || !benchmarkData.length) return base;
    // Yahoo sometimes returns last-day-of-month dates; normalize to month key
    const benchMap = new Map();
    for (const b of benchmarkData) {
      const raw = String(b.fecha || "");
      const mk = raw.slice(0, 7);
      if (!benchMap.has(mk)) benchMap.set(mk, Number(b.rentabilidad || 0));
      // Also store with next-month key for end-of-month Yahoo dates
      const d = new Date(raw + "T00:00:00Z");
      if (!Number.isNaN(d.getTime())) {
        const day = d.getUTCDate();
        const daysInMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
        if (day >= daysInMonth - 2) {
          const nextMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
          const nextKey = nextMonth.toISOString().slice(0, 7);
          if (!benchMap.has(nextKey)) benchMap.set(nextKey, Number(b.rentabilidad || 0));
        }
      }
    }
    return base.map((point) => {
      const monthKey = String(point.mes || point.fecha || "").slice(0, 7);
      const bVal = benchMap.get(monthKey);
      return { ...point, benchmark: bVal ?? null };
    });
  })();

  // ── Objetivos progreso ────────────────────────────────────────────────────
  const totalPortafolioValor = resumenes.reduce((s, r) => s + Number(r.totalCategoriaMoneda || 0), 0);

  // ── Dividendos totales ────────────────────────────────────────────────────
  const dividendosTotalAnio = dividendos
    .filter((d) => String(d.fecha || "").startsWith(String(new Date().getFullYear())))
    .reduce((s, d) => s + Number(d.importe || 0), 0);
  const dividendosTotalHistorico = dividendos.reduce((s, d) => s + Number(d.importe || 0), 0);

  const SIDEBAR_ITEMS = {
    inicio: [
      { key: "resumen", label: "Resumen" },
      { key: "evolucion", label: "Gráficos" },
      { key: "metricas", label: "Métricas de riesgo" },
    ],
    portafolio: [
      { key: "posiciones", label: "Posiciones" },
      { key: "heatmap", label: "Mapa de calor" },
      { key: "correlacion", label: "Correlación" },
      { key: "dividendos", label: "Dividendos" },
      { key: "simulador", label: "Simulador" },
    ],
    cashflow: [
      { key: "calendario", label: "Calendario" },
      { key: "graficos", label: "Gráficos" },
      { key: "movimientos", label: "Movimientos" },
    ],
    watchlist: [
      { key: "watchlist", label: "Watchlist" },
      { key: "alertas", label: "Alertas de precio" },
    ],
    objetivos: [
      { key: "objetivos", label: "Mis objetivos" },
    ],
    snapshots: [
      { key: "snapshots", label: "Snapshots" },
    ],
    noticias: [
      { key: "noticias", label: "Noticias" },
    ],
  };

  function renderSidebar(pageKey, activeSub, setActiveSub) {
    const items = SIDEBAR_ITEMS[pageKey] || [];
    if (items.length <= 1) return null;
    return (
      <nav className="pageSidebar" aria-label="Navegación de sección">
        <div className="pageSidebarTitle">{pageKey.charAt(0).toUpperCase() + pageKey.slice(1)}</div>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`pageSidebarItem${activeSub === item.key ? " active" : ""}`}
            onClick={() => setActiveSub(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  const mainContent = usuario ? (
    <>
      {currentPage === "inicio" ? (
        <>
          <h1>Inicio</h1>
          <p>
            Sesion activa como <strong>{usuario.nombre}</strong>
          </p>

          <section id="sec-inicio-resumen">
            <div className="listHeader">
              <h2>Tabla resumen</h2>
            </div>
            {loadingData ? <p>Cargando...</p> : null}
            <table className="table">
              <thead>
                <tr>
                  <th>INVERSIÓN</th>
                  <th>{monedaResumenTicker}</th>
                  <th>INV. INICIAL</th>
                  <th>RENT.</th>
                  <th>PESO</th>
                  <th>PESO OBJ.</th>
                </tr>
              </thead>
              <tbody>
                {resumenes.length === 0 ? (
                  <tr>
                    <td colSpan="6">No hay registros de resumen</td>
                  </tr>
                ) : (
                  <>
                    {resumenesConAlerta.map((resumen) => (
                      <tr key={resumen.id}>
                        <td>{resumen.categoria_nombre || "-"}</td>
                        <td>{Number(resumen.totalCategoriaMoneda || 0).toFixed(2)}</td>
                        <td>{Number(resumen.inversionInicial || 0).toFixed(2)}</td>
                        <td title={resumen.tooltipRentabilidad}>
                          {Number(resumen.rentabilidad || 0).toFixed(2)}%
                        </td>
                        <td title={resumen.tooltipPeso}>
                          {Number(resumen.peso || 0).toFixed(2)}%{" "}
                          {resumen.needsRebalance ? (
                            <span className="rebalanceBadge" title={resumen.tooltipPeso}>
                              ⚠ Rebalancear
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={getResumenPesoInputValue(resumen)}
                            disabled={savingResumenId === resumen.id}
                            onChange={(e) => handleResumenPesoDraftChange(resumen.id, e.target.value)}
                            onBlur={() => commitResumenPesoObjetivo(resumen)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                resetResumenPesoDraft(resumen);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="summaryTotalRow">
                      <td>Total</td>
                      <td>{Number(totalResumenMoneda || 0).toFixed(2)}</td>
                      <td>{Number(totalInversionInicialResumen || 0).toFixed(2)}</td>
                      <td>{Number(totalRentabilidadResumen || 0).toFixed(2)}%</td>
                      <td>100.00%</td>
                      <td>{Number(totalPesoObjetivoResumen || 0).toFixed(2)}%</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </section>

          <section id="sec-inicio-evolucion" className="sectionCharts">
            <div className="dashboardChartsGrid">
              <article className="chartCard chartCardWide">
                <h3>Peso de la tabla resumen</h3>
                {resumenPieData.length === 0 ? (
                  <p className="chartNoData">No hay datos para mostrar.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={resumenPieData}
                          dataKey="valor"
                          nameKey="categoria"
                          outerRadius={112}
                          labelLine={false}
                          label={renderPiePercentLabel}
                        >
                          {resumenPieData.map((entry, index) => (
                            <Cell
                              key={`resumen-pie-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={buildPiePercentTooltipFormatter(resumenPieTotal)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard chartCardWide">
                <div className="chartCardHeader">
                  <button
                    type="button"
                    className={`buttonSecondary chartToggleButton${
                      inicioPortfolioChartMode === "line" ? " chartToggleButtonActive" : ""
                    }`}
                    onClick={() => setInicioPortfolioChartMode("line")}
                    title="Ver como líneas"
                    aria-label="Ver como líneas"
                  >
                    Línea
                  </button>
                  <h3>Evolución del valor total por portafolios</h3>
                  <button
                    type="button"
                    className={`buttonSecondary chartToggleButton${
                      inicioPortfolioChartMode === "bar" ? " chartToggleButtonActive" : ""
                    }`}
                    onClick={() => setInicioPortfolioChartMode("bar")}
                    title="Ver como columnas"
                    aria-label="Ver como columnas"
                  >
                    Columnas
                  </button>
                </div>
                {loadingInicioCharts ? (
                  <p className="chartNoData">Cargando series de snapshots...</p>
                ) : inicioPortfolioSeries.length === 0 ? (
                  <p className="chartNoData">No hay snapshots para construir la evolucion.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={300}>
                      {inicioPortfolioChartMode === "bar" ? (
                        <ComposedChart data={inicioPortfolioMonthlySeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes_label" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${Number(value || 0).toFixed(2)} ${monedaResumenTicker}`,
                              "Valor"
                            ]}
                          />
                          <Legend
                            onClick={handleInicioPortfolioLegendClick}
                            formatter={(value, entry) => {
                              const hidden = Boolean(hiddenInicioPortfolioKeys[String(entry?.dataKey || "")]);
                              return (
                                <span
                                  style={{
                                    opacity: hidden ? 0.45 : 1,
                                    textDecoration: hidden ? "line-through" : "none",
                                    cursor: String(entry?.dataKey || "").startsWith("pf_")
                                      ? "pointer"
                                      : "default"
                                  }}
                                >
                                  {value}
                                </span>
                              );
                            }}
                          />
                          {inicioPortfolioKeys.map((portfolio) => (
                            <Bar
                              key={portfolio.key}
                              dataKey={portfolio.key}
                              name={portfolio.label}
                              fill={portfolio.color}
                              stackId="pf"
                              hide={Boolean(hiddenInicioPortfolioKeys[portfolio.key])}
                            />
                          ))}
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total"
                            stroke="#0f172a"
                            strokeWidth={2.4}
                            dot={false}
                          />
                        </ComposedChart>
                      ) : (
                        <LineChart data={inicioPortfolioSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha_label" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${Number(value || 0).toFixed(2)} ${monedaResumenTicker}`,
                              "Valor"
                            ]}
                          />
                          <Legend
                            onClick={handleInicioPortfolioLegendClick}
                            formatter={(value, entry) => {
                              const hidden = Boolean(hiddenInicioPortfolioKeys[String(entry?.dataKey || "")]);
                              return (
                                <span
                                  style={{
                                    opacity: hidden ? 0.45 : 1,
                                    textDecoration: hidden ? "line-through" : "none",
                                    cursor: String(entry?.dataKey || "").startsWith("pf_") ? "pointer" : "default"
                                  }}
                                >
                                  {value}
                                </span>
                              );
                            }}
                          />
                          {inicioPortfolioKeys.map((portfolio) => (
                            <Line
                              key={portfolio.key}
                              type="monotone"
                              dataKey={portfolio.key}
                              name={portfolio.label}
                              stroke={portfolio.color}
                              strokeWidth={1.8}
                              dot={false}
                              hide={Boolean(hiddenInicioPortfolioKeys[portfolio.key])}
                            />
                          ))}
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total"
                            stroke="#0f172a"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard chartCardWide">
                <div className="chartCardHeader">
                  <button
                    type="button"
                    className={`buttonSecondary chartToggleButton${
                      inicioRentabilidadChartMode === "line" ? " chartToggleButtonActive" : ""
                    }`}
                    onClick={() => setInicioRentabilidadChartMode("line")}
                    title="Ver como líneas"
                    aria-label="Ver como líneas"
                  >
                    Línea
                  </button>
                  <h3>Evolución de la rentabilidad</h3>
                  <button
                    type="button"
                    className={`buttonSecondary chartToggleButton${
                      inicioRentabilidadChartMode === "bar" ? " chartToggleButtonActive" : ""
                    }`}
                    onClick={() => setInicioRentabilidadChartMode("bar")}
                    title="Ver como columnas"
                    aria-label="Ver como columnas"
                  >
                    Columnas
                  </button>
                  <button
                    type="button"
                    className={`buttonSecondary chartToggleButton${showBenchmark ? " chartToggleButtonActive" : ""}`}
                    onClick={() => setShowBenchmark((prev) => !prev)}
                    title="Comparar con benchmark"
                  >
                    {loadingBenchmark ? "Cargando..." : "Benchmark"}
                  </button>
                  {showBenchmark ? (
                    <select value={benchmarkSymbol} onChange={(e) => setBenchmarkSymbol(e.target.value)}
                      style={{ fontSize: "0.78rem", padding: "2px 6px" }}>
                      {["SP500", "IBEX35", "EUROSTOXX50", "NASDAQ", "DAX"].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  ) : null}
                  {showBenchmark && !loadingBenchmark && benchmarkData.length === 0 ? (
                    <span style={{ fontSize: "0.72rem", color: "var(--red-600)" }}>Sin datos de benchmark</span>
                  ) : null}
                  {showBenchmark ? (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      Datos vía{" "}
                      <a href="https://finance.yahoo.com" target="_blank" rel="noreferrer"
                        style={{ color: "var(--blue-600)", textDecoration: "underline" }}>
                        Yahoo Finance
                      </a>
                      {" · "}
                      {benchmarkSymbol === "SP500" && "S&P 500 (^GSPC) — 500 mayores empresas de EE.UU."}
                      {benchmarkSymbol === "IBEX35" && "IBEX 35 (^IBEX) — 35 mayores empresas del mercado español."}
                      {benchmarkSymbol === "EUROSTOXX50" && "Euro Stoxx 50 (^STOXX50E) — 50 líderes de la eurozona."}
                      {benchmarkSymbol === "NASDAQ" && "Nasdaq Composite (^IXIC) — Todas las empresas del Nasdaq (tech)."}
                      {benchmarkSymbol === "DAX" && "DAX 40 (^GDAXI) — 40 mayores empresas alemanas."}
                    </span>
                  ) : null}
                </div>
                {loadingInicioCharts ? (
                  <p className="chartNoData">Cargando rentabilidad...</p>
                ) : inicioRentabilidadSeries.length === 0 ? (
                  <p className="chartNoData">No hay datos suficientes para calcular rentabilidad.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      {inicioRentabilidadChartMode === "bar" ? (
                        <ComposedChart data={inicioRentabilidadWithBenchmark}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes_label" />
                          <YAxis />
                          <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 2" />
                          <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)}%`]} />
                          <Legend />
                          <Bar dataKey="rentabilidad" name="Mi portafolio" fill="#16a34a" />
                          {showBenchmark ? (
                            <Line type="monotone" dataKey="benchmark" name={benchmarkSymbol}
                              stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
                          ) : null}
                        </ComposedChart>
                      ) : (
                        <LineChart data={inicioRentabilidadWithBenchmark}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes_label" />
                          <YAxis />
                          <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 2" />
                          <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)}%`]} />
                          <Legend />
                          <Line type="monotone" dataKey="rentabilidad" name="Mi portafolio"
                            stroke="#16a34a" strokeWidth={2.4} dot={false} />
                          {showBenchmark ? (
                            <Line type="monotone" dataKey="benchmark" name={benchmarkSymbol}
                              stroke="#f97316" strokeWidth={1.8} strokeDasharray="5 3"
                              dot={false} connectNulls />
                          ) : null}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </div>
          </section>

          {riskMetrics ? (
            <section id="sec-inicio-metricas">
              <h2>Metricas de riesgo del portafolio</h2>
              {(() => {
                const RISK_INFO = {
                  sharpe: { label: "Sharpe Ratio", color: (v) => Number(v) >= 1 ? "var(--green-600)" : Number(v) >= 0 ? "var(--amber-600)" : "var(--red-600)", suffix: "", explain: "Mide el retorno extra por unidad de riesgo total. Sharpe > 1 es bueno, > 2 muy bueno, < 0 indica perdida ajustada al riesgo. Fórmula: (Retorno anual - 0%) / Volatilidad anual." },
                  sortino: { label: "Sortino Ratio", color: (v) => Number(v) >= 1 ? "var(--green-600)" : Number(v) >= 0 ? "var(--amber-600)" : "var(--red-600)", suffix: "", explain: "Como Sharpe pero solo penaliza la volatilidad negativa (bajadas). Es más justo para activos asimétricos. Sortino > 2 es excelente." },
                  volatilidad: { label: "Volatilidad anual", color: () => "var(--text-primary)", suffix: "%", explain: "Desviación estándar de los retornos diarios escalada a un año. Una volatilidad alta implica más riesgo (y potencial beneficio). Mercados maduros suelen tener 15-20%." },
                  maxDrawdown: { label: "Max Drawdown", color: () => "var(--red-600)", suffix: "%", explain: "Mayor caída desde un máximo histórico. Indica el peor escenario que has vivido. Un drawdown de -20% significa que en el peor momento perdiste un 20% desde el pico." },
                  calmar: { label: "Calmar Ratio", color: (v) => Number(v) >= 0.5 ? "var(--green-600)" : "var(--text-primary)", suffix: "", explain: "Retorno anual / Max Drawdown absoluto. Mide si el retorno compensa el riesgo de caída máxima. Calmar > 1 es positivo." },
                  cagr: { label: "CAGR", color: (v) => Number(v) >= 0 ? "var(--green-600)" : "var(--red-600)", suffix: "%", explain: "Tasa de Crecimiento Anual Compuesta. Representa el retorno anualizado si el portafolio hubiera crecido a tasa constante. Es la métrica más representativa del rendimiento a largo plazo." },
                  winRate: { label: "Win Rate", color: (v) => Number(v) >= 55 ? "var(--green-600)" : "var(--text-primary)", suffix: "%", explain: "Porcentaje de días con retorno positivo. > 55% es generalmente bueno, aunque es menos importante que la magnitud de las ganancias vs pérdidas." },
                  annualReturn: { label: "Retorno anual est.", color: (v) => Number(v) >= 0 ? "var(--green-600)" : "var(--red-600)", suffix: "%", explain: "Retorno medio diario escalado a 252 días hábiles. Es una estimación del retorno anual basada en el comportamiento histórico reciente." },
                  var95: { label: "VaR 95% diario", color: (v) => Number(v) > 3 ? "var(--red-600)" : "var(--text-primary)", suffix: "%", explain: "Value at Risk al 95% de confianza (paramétrico). Indica la pérdida máxima diaria esperada con 95% de probabilidad. Si es 2%, un día malo típico no supera el -2%. Valores > 3% indican alta concentración de riesgo." },
                  painIndex: { label: "Pain Index", color: (v) => Number(v) > 10 ? "var(--red-600)" : Number(v) > 5 ? "var(--amber-600)" : "var(--green-600)", suffix: "%", explain: "Media de todas las caídas desde máximos a lo largo del histórico. A diferencia del Max Drawdown (peor caso), el Pain Index mide el dolor promedio. < 5% es excelente, > 10% indica drawdowns frecuentes." },
                  recoveryFactor: { label: "Recovery Factor", color: (v) => Number(v) >= 1 ? "var(--green-600)" : "var(--text-primary)", suffix: "", explain: "CAGR dividido entre el Max Drawdown absoluto. Mide la capacidad de recuperación: si es > 1 el portafolio genera más rentabilidad de la que pierde en sus peores caídas. > 1 es positivo, > 2 es excelente." },
                };
                return (
                  <div className="riskMetricsGrid">
                    {Object.entries(RISK_INFO).map(([key, meta]) => (
                      <div key={key} className="riskMetricCard" style={{ position: "relative" }}>
                        <div className="riskMetricLabel" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {meta.label}
                          <button type="button"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px", lineHeight: 1 }}
                            onClick={() => setShowRiskInfo(showRiskInfo === key ? null : key)}
                            title="Info"
                          >ⓘ</button>
                        </div>
                        {showRiskInfo === key ? (
                          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: 260, boxShadow: "var(--shadow-lg)", lineHeight: 1.5 }}>
                            {meta.explain}
                            <button type="button" onClick={() => setShowRiskInfo(null)}
                              style={{ display: "block", marginTop: 6, fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer", color: "var(--blue-600)" }}>
                              Cerrar
                            </button>
                          </div>
                        ) : null}
                        <div className="riskMetricValue" style={{ color: meta.color(riskMetrics[key]) }}>
                          {riskMetrics[key]}{meta.suffix}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                Calculado a partir de los snapshots del portafolio (retornos diarios). Se requieren al menos 4 puntos históricos.
              </p>
            </section>
          ) : null}

          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "portafolio" ? (
        <>
          <h1>{selectedPortafolio ? selectedPortafolio.nombre : "Portafolios"}</h1>
          {!selectedPortafolio && portafolios.length === 0 ? (
            <section>
              <p style={{ color: "var(--text-muted)" }}>
                Crea tu primer portafolio usando el botón <strong>+ Nuevo</strong> del menú lateral.
              </p>
            </section>
          ) : !selectedPortafolio ? (
            <section>
              <p style={{ color: "var(--text-muted)" }}>
                Selecciona un portafolio del menú lateral para ver sus posiciones.
              </p>
            </section>
          ) : null}

          {showPortafolioForm ? (
            <section>
              <h2>{editingId ? "Editar portafolio" : "Nuevo portafolio"}</h2>
              <form onSubmit={handlePortafolioSubmit} className="form portafolioFormGrid">
                <div className="portafolioField portafolioFieldNombre">
                  <label htmlFor="pfNombre">Nombre</label>
                  <input
                    id="pfNombre"
                    name="pfNombre"
                    value={pfNombre}
                    onChange={(e) => setPfNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="portafolioField portafolioFieldMoneda">
                  <label htmlFor="pfMoneda">Divisa</label>
                  <select
                    id="pfMoneda"
                    value={pfMonedaId}
                    onChange={(e) => setPfMonedaId(e.target.value)}
                  >
                    <option value="">Sin moneda</option>
                    {monedas.map((moneda) => (
                      <option key={moneda.id} value={moneda.id}>
                        {moneda.nombre} {moneda.ticker ? `(${moneda.ticker})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="portafolioField portafolioFieldCategoria">
                  <label htmlFor="pfCategoria">Categoría</label>
                  <select
                    id="pfCategoria"
                    value={pfCategoriaId}
                    onChange={(e) => setPfCategoriaId(e.target.value)}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="actionsRow portafolioFormActions">
                  <button type="submit" disabled={loading}>
                    {loading ? "Procesando..." : editingId ? "Guardar cambios" : "Crear"}
                  </button>
                  <button
                    type="button"
                    className="buttonSecondary"
                    onClick={() => { setEditingId(null); clearPortafolioForm(); setShowPortafolioForm(false); }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section id="sec-portafolio-posiciones">
            <h2>
              {selectedPortafolio
                ? `Posiciones de ${selectedPortafolio.nombre}`
                : "Posiciones del portafolio"}
            </h2>
            {!selectedPortafolio ? (
              <p>Selecciona un portafolio para ver sus posiciones.</p>
            ) : null}
            {loadingPosiciones ? <p>Cargando posiciones...</p> : null}
            {selectedPortafolio && resumenPosiciones ? (
              <div className="summaryGrid">
                <article className="summaryCard">
                  <h2>{posiciones.filter((p) => Number(p.cantidad || 0) > 0).length}</h2>
                  <p>Total posiciones</p>
                </article>
                <article className="summaryCard">
                  <h2>
                    {portfolioRentabilidadPct >= 0 ? "+" : ""}
                    {portfolioRentabilidadPct.toFixed(2)}%
                  </h2>
                  <p>Rentabilidad del portafolio</p>
                </article>
                <article className="summaryCard">
                  <h2>{Number(resumenPosiciones.valor_total || 0).toFixed(2)}</h2>
                  <p>Valor total</p>
                </article>
              </div>
            ) : null}
            {selectedPortafolio ? (
              <>
                <div className="actionsRow">
                  <button
                    type="button"
                    className={`buttonSecondary iconToggleButton${
                      showOrdenForm ? " iconToggleButtonOpen" : ""
                    }`}
                    onClick={() => setShowOrdenForm((prev) => !prev)}
                    title={
                      showOrdenForm ? "Ocultar formulario de ordenes" : "Mostrar formulario de ordenes"
                    }
                    aria-label={
                      showOrdenForm ? "Ocultar formulario de ordenes" : "Mostrar formulario de ordenes"
                    }
                  >
                    <img src="/buttons/add.svg" alt="" aria-hidden="true" className="iconToggleImage" />
                  </button>
                </div>
                {showOrdenForm ? (
                  <>
                    <h3>Registrar orden</h3>
                    <form onSubmit={handleOrdenSubmit} className="form ordenFormGrid">
                      <div className="ordenField ordenFieldTipo">
                        <label htmlFor="ordenTipo">Tipo de orden</label>
                        <select
                          id="ordenTipo"
                          value={ordenTipo}
                          onChange={(e) => setOrdenTipo(e.target.value)}
                          required
                        >
                          <option value="compra">Compra</option>
                          <option value="venta">Venta</option>
                        </select>
                      </div>

                      {ordenTipo === "compra" ? (
                        <>
                          <div className="ordenField ordenFieldActivo">
                            <label htmlFor="ordenActivo">Activo existente (opcional)</label>
                            <select
                              id="ordenActivo"
                              value={ordenActivoId}
                              onChange={(e) => setOrdenActivoId(e.target.value)}
                            >
                              <option value="">Selecciona un activo (o usa ticker abajo)</option>
                              {activos.map((activo) => (
                                <option key={activo.id} value={activo.id}>
                                  {activo.nombre} {activo.ticker ? `(${activo.ticker})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ordenField ordenFieldTicker">
                            <label htmlFor="ordenActivoTicker">Ticker Yahoo Finance</label>
                            <div className="actionsRow">
                              <input
                                id="ordenActivoTicker"
                                value={ordenActivoTicker}
                                onChange={(e) => setOrdenActivoTicker(e.target.value.toUpperCase())}
                                placeholder="Ej: AAPL, MSFT, BTC-USD"
                              />
                              <button
                                type="button"
                                className="buttonSecondary"
                                onClick={handleImportActivoDesdeYahoo}
                                disabled={loadingActivoYahoo || !ordenActivoTicker.trim()}
                              >
                                {loadingActivoYahoo ? "Buscando..." : "Buscar e importar"}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="ordenField ordenFieldPosicion">
                          <label htmlFor="ordenPosicion">Posicion</label>
                          <select
                            id="ordenPosicion"
                            value={ordenPosicionId}
                            onChange={(e) => setOrdenPosicionId(e.target.value)}
                            required={ordenTipo === "venta"}
                          >
                            <option value="">Selecciona una posicion</option>
                            {posiciones
                              .filter((p) => (ordenTipo === "venta" ? Number(p.cantidad || 0) > 0 : true))
                              .map((posicion) => (
                                <option key={posicion.id} value={posicion.id}>
                                  {posicion.activo_nombre || "Activo"} ({posicion.ticker || "-"}) -{" "}
                                  {Number(posicion.cantidad || 0).toFixed(4)}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <div className="ordenField ordenFieldCantidad">
                        <label htmlFor="ordenCantidad">Cantidad</label>
                        <input
                          id="ordenCantidad"
                          type="number"
                          min="0.00000001"
                          step="0.00000001"
                          value={ordenCantidad}
                          onChange={(e) => setOrdenCantidad(e.target.value)}
                          required
                        />
                      </div>

                      <div className="ordenField ordenFieldPrecio">
                        <label htmlFor="ordenPrecio">Precio</label>
                        <input
                          id="ordenPrecio"
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={ordenPrecio}
                          onChange={(e) => setOrdenPrecio(e.target.value)}
                          required
                        />
                      </div>

                      <div className="ordenField ordenFieldComision">
                        <label htmlFor="ordenComision">Comision</label>
                        <input
                          id="ordenComision"
                          type="number"
                          min="0"
                          step="0.0001"
                          value={ordenComision}
                          onChange={(e) => setOrdenComision(e.target.value)}
                        />
                      </div>

                      <div className="ordenField ordenFieldObservacion">
                        <label htmlFor="ordenObservacion">Observacion</label>
                        <input
                          id="ordenObservacion"
                          value={ordenObservacion}
                          onChange={(e) => setOrdenObservacion(e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>

                      <div className="actionsRow ordenFormActions">
                        <button type="submit" disabled={loading}>
                          {loading ? "Procesando..." : "Ejecutar orden"}
                        </button>
                        <button type="button" className="buttonSecondary" onClick={clearOrdenForm}>
                          Limpiar
                        </button>
                      </div>
                    </form>
                  </>
                ) : null}

                <table className="table">
                  <thead>
                    <tr>
                      <th>Logo</th>
                      <th>
                        <button
                          type="button"
                          className="tableSortButton"
                          onClick={() =>
                            setPosicionesSort((prev) => getNextSortState(prev, "activo_nombre", "asc"))
                          }
                        >
                          Nombre <span>{getSortIndicator(posicionesSort, "activo_nombre")}</span>
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="tableSortButton"
                          onClick={() =>
                            setPosicionesSort((prev) => getNextSortState(prev, "precio_actual", "desc"))
                          }
                        >
                          Valor actual <span>{getSortIndicator(posicionesSort, "precio_actual")}</span>
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="tableSortButton"
                          onClick={() =>
                            setPosicionesSort((prev) => getNextSortState(prev, "variacion_diaria", "desc"))
                          }
                        >
                          Var. diaria{" "}
                          <span>{getSortIndicator(posicionesSort, "variacion_diaria")}</span>
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="tableSortButton"
                          onClick={() =>
                            setPosicionesSort((prev) => getNextSortState(prev, "valor_total", "desc"))
                          }
                        >
                          Valor total <span>{getSortIndicator(posicionesSort, "valor_total")}</span>
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className="tableSortButton"
                          onClick={() =>
                            setPosicionesSort((prev) => getNextSortState(prev, "rentabilidad", "desc"))
                          }
                        >
                          Rentab. <span>{getSortIndicator(posicionesSort, "rentabilidad")}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePosiciones.length === 0 ? (
                      <tr>
                        <td colSpan="6">No hay posiciones para el filtro actual</td>
                      </tr>
                    ) : (
                      visiblePosiciones.map((posicion) => {
                        const isExpanded = String(expandedPosicionId) === String(posicion.id);
                        return (
                          <Fragment key={posicion.id}>
                            <tr
                              className={isExpanded ? "tableRowSelected" : "tableRowClickable"}
                              onClick={() =>
                                setExpandedPosicionId((prev) =>
                                  String(prev) === String(posicion.id) ? null : String(posicion.id)
                                )
                              }
                            >
                              <td>
                                {resolvePosicionLogoSrc(posicion) ? (
                                  <img
                                    src={resolvePosicionLogoSrc(posicion)}
                                    alt={posicion.ticker || posicion.activo_nombre || "Logo activo"}
                                    style={{ width: "24px", height: "24px", objectFit: "contain" }}
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>{posicion.activo_nombre || "-"}</td>
                              <td>{formatPrice(posicion.precio_actual)}</td>
                              <td>{formatPercent(posicion.variacion_diaria)}</td>
                              <td>
                                {Number(posicion.valor_total || posicion.valor_actual || 0).toFixed(2)}
                                {posicion.precio_actual_moneda_ticker ? ` ${posicion.precio_actual_moneda_ticker}` : ""}
                              </td>
                              <td style={{ color: Number(posicion.rentabilidad || 0) >= 0 ? "var(--green-600)" : "var(--red-600)", fontWeight: 600 }}>
                                {Number(posicion.rentabilidad || 0) >= 0 ? "+" : ""}
                                {Number(posicion.rentabilidad || 0).toFixed(2)}%
                              </td>
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td colSpan="6">
                                  <article className="assetCard">
                                    <h3>{expandedPosicion?.activo_nombre || "-"}</h3>
                                    <h4>Posicion</h4>
                                    <div className="assetCardGrid">
                                      <p>
                                        <strong>Cantidad:</strong>{" "}
                                        {Number(expandedPosicion?.cantidad || 0).toFixed(4)}
                                      </p>
                                      <p>
                                        <strong>Precio promedio:</strong>{" "}
                                        {Number(expandedPosicion?.preciopromedio || 0).toFixed(4)}
                                      </p>
                                    </div>
                                    <div style={{ marginTop: "12px" }}>
                                      <h4>Detalles del activo</h4>
                                      <div className="assetCardGrid">
                                        <p>
                                          <strong>Ticker:</strong>{" "}
                                          {expandedPosicionActivo?.ticker || expandedPosicion?.ticker || "-"}
                                        </p>
                                        <p>
                                          <strong>Categoria:</strong>{" "}
                                          {expandedPosicionActivo?.categoria || "-"}
                                        </p>
                                        <p>
                                          <strong>Logo:</strong>{" "}
                                          {expandedPosicionIconSrc ? (
                                            <img
                                              src={expandedPosicionIconSrc}
                                              alt={
                                                expandedPosicionActivo?.ticker ||
                                                expandedPosicion?.ticker ||
                                                expandedPosicionActivo?.nombre ||
                                                expandedPosicion?.activo_nombre ||
                                                "Icono activo"
                                              }
                                              style={{
                                                width: "32px",
                                                height: "32px",
                                                objectFit: "contain",
                                                verticalAlign: "middle"
                                              }}
                                              onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                              }}
                                            />
                                          ) : (
                                            "-"
                                          )}
                                        </p>
                                        <p>
                                          <strong>Precio:</strong>{" "}
                                          {formatPriceOrDashZero(
                                            expandedPosicionActivo?.precio ??
                                              expandedPosicion?.precio_actual
                                          )}
                                        </p>
                                        <p>
                                          <strong>Capitalizacion:</strong>{" "}
                                          {formatLargeNumberOrDashZero(
                                            expandedPosicionActivo?.capitalizacion ?? expandedPosicion?.capitalizacion
                                          )}
                                        </p>
                                        <p>
                                          <strong>Volumen:</strong>{" "}
                                          {formatLargeNumberOrDashZero(
                                            expandedPosicionActivo?.volumen ?? expandedPosicion?.volumen
                                          )}
                                        </p>
                                        <p>
                                          <strong>Variacion:</strong>{" "}
                                          {formatPercentOrDashZero(
                                            expandedPosicionActivo?.variacion_porcentual ??
                                              expandedPosicion?.variacion_diaria
                                          )}
                                        </p>
                                        <p>
                                          <strong>Moneda:</strong>{" "}
                                          {expandedPosicionActivo?.moneda || expandedPosicion?.moneda || "-"}
                                        </p>
                                        <p>
                                          <strong>Mercado:</strong>{" "}
                                          {expandedPosicionActivo?.mercado || expandedPosicion?.mercado || "-"}
                                        </p>
                                      </div>
                                      {Number(expandedPosicionActivo?.categoria_id || 0) === 2 ? (
                                        <div style={{ marginTop: "12px" }}>
                                          <h4>DetallesAccion</h4>
                                          {loadingDetallePosicion ? (
                                            <p>Cargando detalles de accion...</p>
                                          ) : detalleAccionPosicion ? (
                                            <div className="assetCardGrid">
                                              <p>
                                                <strong>Sector:</strong>{" "}
                                                {detalleAccionPosicion.sector_nombre || "-"}
                                              </p>
                                            </div>
                                          ) : (
                                            <p>No hay DetallesAccion para este activo.</p>
                                          )}
                                        </div>
                                      ) : null}
                                      {Number(expandedPosicionActivo?.categoria_id || 0) === 3 ? (
                                        <div style={{ marginTop: "12px" }}>
                                          <h4>DetallesFondo</h4>
                                          {loadingDetallePosicion ? (
                                            <p>Cargando detalles de fondo...</p>
                                          ) : detalleFondoPosicion ? (
                                            <div className="assetCardGrid">
                                              <p>
                                                <strong>Gestora:</strong>{" "}
                                                {detalleFondoPosicion.gestora_nombre || "-"}
                                              </p>
                                              <p>
                                                <strong>Politica:</strong>{" "}
                                                {detalleFondoPosicion.politica || "-"}
                                              </p>
                                              <p>
                                                <strong>Tipo:</strong> {detalleFondoPosicion.tipo || "-"}
                                              </p>
                                              <p>
                                                <strong>Geografia:</strong>{" "}
                                                {detalleFondoPosicion.geografia || "-"}
                                              </p>
                                            </div>
                                          ) : (
                                            <p>No hay DetallesFondo para este activo.</p>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                    <div style={{ marginTop: "12px" }}>
                                      <h4>Nota</h4>
                                      {editingNotaPosicionId === expandedPosicion?.id ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                          <textarea
                                            className="notaTextarea"
                                            value={notaPosicionDraft}
                                            onChange={(e) => setNotaPosicionDraft(e.target.value)}
                                            placeholder="Escribe tu tesis de inversión u observaciones..."
                                          />
                                          <div className="actionsRow">
                                            <button type="button" className="buttonPrimary"
                                              onClick={() => handleGuardarNotaPosicion(expandedPosicion.id)}>
                                              Guardar
                                            </button>
                                            <button type="button" className="buttonSecondary"
                                              onClick={() => setEditingNotaPosicionId(null)}>
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <p style={{ fontSize: "0.83rem", whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                                            {expandedPosicion?.nota || "Sin nota."}
                                          </p>
                                          <button type="button" className="buttonSecondary"
                                            style={{ marginTop: 4 }}
                                            onClick={() => {
                                              setEditingNotaPosicionId(expandedPosicion.id);
                                              setNotaPosicionDraft(expandedPosicion.nota || "");
                                            }}>
                                            Editar nota
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </article>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <section className="sectionCharts">
                  <div className="dashboardChartsGrid">
                    <article className="chartCard chartCardWide">
                      <div className="chartCardHeader">
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesEvolutionChartMode === "line" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesEvolutionChartMode("line")}
                          title="Ver como líneas"
                          aria-label="Ver como líneas"
                        >
                          Línea
                        </button>
                        <h3>Evolucion total por posiciones</h3>
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesEvolutionChartMode === "bar" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesEvolutionChartMode("bar")}
                          title="Ver como columnas"
                          aria-label="Ver como columnas"
                        >
                          Columnas
                        </button>
                      </div>
                      <div className="actionsRow chartControlsRow">
                        <select
                          className="chartSelect"
                          value={selectedPosicionChartKey}
                          onChange={(event) => setSelectedPosicionChartKey(event.target.value)}
                          disabled={loadingPosicionCharts || posicionesEvolutionKeys.length === 0}
                        >
                          {posicionesEvolutionKeys.length === 0 ? (
                            <option value="">No hay posiciones</option>
                          ) : null}
                          {posicionesEvolutionKeys.map((serie) => (
                            <option key={serie.key} value={serie.key}>
                              {serie.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="buttonSecondary"
                          onClick={handleAddPosicionLine}
                          disabled={
                            loadingPosicionCharts ||
                            !selectedPosicionChartKey ||
                            visiblePosicionChartKeys.includes(selectedPosicionChartKey)
                          }
                        >
                          Anadir posicion
                        </button>
                      </div>
                      {visiblePosicionChartKeys.length > 0 ? (
                        <div className="chartTagList">
                          {visiblePosicionChartKeys.map((key) => {
                            const serie = posicionesEvolutionKeys.find((item) => item.key === key);
                            if (!serie) return null;
                            return (
                              <button
                                key={`chip-${key}`}
                                type="button"
                                className="buttonSecondary chartTagButton"
                                onClick={() => handleRemovePosicionLine(key)}
                                title={`Quitar ${serie.label}`}
                              >
                                {serie.label} x
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="chartNoData">Solo se muestra Total. Añade posiciones para compararlas.</p>
                      )}
                      {loadingPosicionCharts ? (
                        <p className="chartNoData">Cargando snapshots de posiciones...</p>
                      ) : posicionesEvolutionSeries.length === 0 ? (
                        <p className="chartNoData">No hay snapshots para construir esta evolucion.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={320}>
                            {posicionesEvolutionChartMode === "bar" ? (
                              <BarChart data={posicionesEvolutionMonthlySeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes_label" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)}`, "Valor"]} />
                                <Legend />
                                {posicionesEvolutionKeys
                                  .filter((serie) => visiblePosicionChartKeys.includes(serie.key))
                                  .map((serie) => (
                                    <Bar
                                      key={serie.key}
                                      dataKey={serie.key}
                                      name={serie.label}
                                      fill={serie.color}
                                    />
                                  ))}
                                <Bar dataKey="total" name="Total" fill="#0f172a" />
                              </BarChart>
                            ) : (
                              <LineChart data={posicionesEvolutionSeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha_label" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)}`, "Valor"]} />
                                <Legend />
                                {posicionesEvolutionKeys
                                  .filter((serie) => visiblePosicionChartKeys.includes(serie.key))
                                  .map((serie) => (
                                    <Line
                                      key={serie.key}
                                      type="monotone"
                                      dataKey={serie.key}
                                      name={serie.label}
                                      stroke={serie.color}
                                      strokeWidth={1.8}
                                      dot={false}
                                    />
                                  ))}
                                <Line
                                  type="monotone"
                                  dataKey="total"
                                  name="Total"
                                  stroke="#0f172a"
                                  strokeWidth={2.5}
                                  dot={false}
                                />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>

                    <article className="chartCard chartCardWide">
                      <div className="chartCardHeader">
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesPesoChartMode === "posiciones" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesPesoChartMode("posiciones")}
                          title="Peso por posiciones"
                          aria-label="Peso por posiciones"
                        >
                          Posiciones
                        </button>
                        <h3>
                          {posicionesPesoChartMode === "sector" ? "Peso por sector" : "Peso por posiciones"}
                        </h3>
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesPesoChartMode === "sector" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesPesoChartMode("sector")}
                          disabled={Number(selectedPortafolio?.categoria_id || 0) !== 2}
                          title="Peso por sector"
                          aria-label="Peso por sector"
                        >
                          Sector
                        </button>
                      </div>
                      {posicionesPesoChartData.length === 0 ? (
                        <p className="chartNoData">No hay datos con valor para mostrar.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                              <Pie
                                data={posicionesPesoChartData}
                                dataKey="valor"
                                nameKey="nombre"
                                outerRadius={112}
                                labelLine={false}
                                label={renderPiePercentLabel}
                              >
                                {posicionesPesoChartData.map((entry, index) => (
                                  <Cell
                                    key={`pos-pie-${entry.nombre}-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={buildPiePercentTooltipFormatter(posicionesPesoChartTotal)}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>

                    <article className="chartCard chartCardWide">
                      <div className="chartCardHeader">
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesRentabilidadChartMode === "line" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesRentabilidadChartMode("line")}
                          title="Ver como líneas"
                          aria-label="Ver como líneas"
                        >
                          Línea
                        </button>
                        <h3>Evolucion de la rentabilidad del portafolio</h3>
                        <button
                          type="button"
                          className={`buttonSecondary chartToggleButton${
                            posicionesRentabilidadChartMode === "bar" ? " chartToggleButtonActive" : ""
                          }`}
                          onClick={() => setPosicionesRentabilidadChartMode("bar")}
                          title="Ver como columnas"
                          aria-label="Ver como columnas"
                        >
                          Columnas
                        </button>
                      </div>
                      {loadingPosicionCharts ? (
                        <p className="chartNoData">Cargando rentabilidad...</p>
                      ) : posicionesRentabilidadSeries.length === 0 ? (
                        <p className="chartNoData">No hay datos suficientes para calcular rentabilidad.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={260}>
                            {posicionesRentabilidadChartMode === "bar" ? (
                              <BarChart data={posicionesRentabilidadMonthlySeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes_label" />
                                <YAxis />
                                <Tooltip
                                  formatter={(value) => [`${Number(value || 0).toFixed(2)}%`, "Rentabilidad"]}
                                />
                                <Legend />
                                <Bar dataKey="rentabilidad" name="Rentabilidad" fill="#16a34a" />
                              </BarChart>
                            ) : (
                              <LineChart data={posicionesRentabilidadSeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha_label" />
                                <YAxis />
                                <Tooltip
                                  formatter={(value) => [`${Number(value || 0).toFixed(2)}%`, "Rentabilidad"]}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="rentabilidad"
                                  name="Rentabilidad"
                                  stroke="#16a34a"
                                  strokeWidth={2.4}
                                  dot={false}
                                />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>
                  </div>
                </section>

                <h3>Ordenes del portafolio</h3>
                {loadingOrdenes ? <p>Cargando ordenes...</p> : null}
                <table className="table">
                  <thead>
                    <tr>
                      <th aria-label="Tipo"></th>
                      <th>Activo</th>
                      <th>Fecha</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Comision</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrdenes.length === 0 ? (
                      <tr>
                        <td colSpan="8">No hay ordenes en este portafolio</td>
                      </tr>
                    ) : (
                      pagedOrdenes.map((orden) => {
                        const isExpanded = String(expandedOrdenId) === String(orden.id);
                        return (
                          <Fragment key={orden.id}>
                            <tr
                              className={isExpanded ? "tableRowSelected" : "tableRowClickable"}
                              onClick={() =>
                                setExpandedOrdenId((prev) =>
                                  String(prev) === String(orden.id) ? null : String(orden.id)
                                )
                              }
                            >
                              <td>
                                {orden.tipo === "venta"
                                  ? renderDirectionBadge("left", "Venta", "Sell")
                                  : renderDirectionBadge("right", "Compra", "Buy")}
                              </td>
                              <td>{orden.activo_nombre || "-"}</td>
                              <td>{orden.fecha ? String(orden.fecha).slice(0, 10) : "-"}</td>
                              <td>{Number(orden.cantidad || 0).toFixed(4)}</td>
                              <td>{Number(orden.precio || 0).toFixed(4)}</td>
                              <td>{Number(orden.comision || 0).toFixed(4)}</td>
                              <td>{Number(orden.valor_total || 0).toFixed(2)}</td>
                              <td className="actionsCell">
                                <button
                                  type="button"
                                  className="buttonDanger iconActionButton"
                                  title="Eliminar orden"
                                  aria-label="Eliminar orden"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteOrden(orden.id);
                                  }}
                                >
                                  <img
                                    src="/buttons/delete.svg"
                                    alt=""
                                    aria-hidden="true"
                                    className="iconActionImage"
                                  />
                                </button>
                              </td>
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td colSpan="8">
                                  <article className="assetCard">
                                    <p style={{ marginTop: 0, marginBottom: 0 }}>
                                      <strong>Observacion:</strong>{" "}
                                      {String(orden.observacion || "").trim() || "Sin observacion"}
                                    </p>
                                  </article>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {renderPagination(currentOrdenesPage, totalOrdenesPages, setOrdenesPage)}
              </>
            ) : null}
          </section>

          {selectedPortafolio && heatmapData.length > 0 ? (
            <section id="sec-portafolio-heatmap">
              <h2>Mapa de calor de posiciones</h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8 }}>
                Tamaño proporcional al peso. Color según variación diaria si disponible, o rentabilidad total (desde compra) si no hay datos de mercado en tiempo real.
              </p>
              <div className="heatmapGrid">
                {heatmapData
                  .sort((a, b) => b.size - a.size)
                  .map((item) => {
                    const v = Number(item.variacion || 0);
                    const intensity = Math.min(Math.abs(v) / 5, 1);
                    const bg = v >= 0
                      ? `rgba(22, 163, 74, ${0.25 + intensity * 0.65})`
                      : `rgba(220, 38, 38, ${0.25 + intensity * 0.65})`;
                    const flex = Math.max(50, (Number(item.size) / heatmapData[0].size) * 180);
                    return (
                      <div
                        key={item.name}
                        className="heatmapCell"
                        style={{ background: bg, flex: `0 0 ${flex}px`, maxWidth: `${flex}px` }}
                        title={`${item.name}: ${item.peso}% del portafolio | ${v >= 0 ? "+" : ""}${v.toFixed(2)}% ${item.variacionEsDiaria ? "hoy" : "rentabilidad total"}`}
                      >
                        <span className="heatmapCellTicker">{item.name}</span>
                        <span className="heatmapCellPct">{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : null}

          {correlationMatrix && correlationMatrix.keys.length >= 2 ? (
            <section id="sec-portafolio-correlacion">
              <h2>Matriz de correlacion</h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8 }}>
                Basada en los retornos diarios de los snapshots. Escala de -1 (inversa) a +1 (directa).
              </p>
              <div style={{ overflowX: "auto" }}>
                <div className="correlationGrid" style={{
                  gridTemplateColumns: `80px repeat(${correlationMatrix.keys.length}, 44px)`
                }}>
                  <div className="correlationLabel" />
                  {correlationMatrix.keys.map((k) => (
                    <div key={k.key} className="correlationLabel" title={k.label}
                      style={{ fontSize: "0.65rem", textAlign: "center" }}>
                      {k.label.split("(")[0].trim().slice(0, 6)}
                    </div>
                  ))}
                  {correlationMatrix.keys.map((ki, rowIdx) => (
                    <Fragment key={ki.key}>
                      <div className="correlationLabel" title={ki.label}>{ki.label.split("(")[0].trim().slice(0, 10)}</div>
                      {correlationMatrix.matrix[rowIdx].map((val, colIdx) => {
                        const v = Number(val || 0);
                        const abs = Math.abs(v);
                        const bg = v >= 0
                          ? `rgba(22,163,74,${abs * 0.7})`
                          : `rgba(220,38,38,${abs * 0.7})`;
                        return (
                          <div key={colIdx} className="correlationCell"
                            style={{ background: bg, color: abs > 0.4 ? "#fff" : "var(--text-primary)" }}
                            title={`${ki.label} ↔ ${correlationMatrix.keys[colIdx].label}: ${v.toFixed(2)}`}>
                            {v.toFixed(2)}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {selectedPortafolio ? (
            <section id="sec-portafolio-dividendos">
              <div className="listHeader">
                <h2>Dividendos del portafolio</h2>
                <button type="button" className="buttonSecondary"
                  onClick={() => setShowDividendoForm((prev) => !prev)}>
                  {showDividendoForm ? "Cancelar" : "+ Registrar dividendo"}
                </button>
              </div>
              {showDividendoForm ? (
                <form onSubmit={handleCrearDividendo} className="form" style={{ maxWidth: 480 }}>
                  <div className="formField">
                    <label>Posicion</label>
                    <select value={divPosicionId} onChange={(e) => setDivPosicionId(e.target.value)} required>
                      <option value="">Selecciona posicion</option>
                      {posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => (
                        <option key={p.id} value={p.id}>{p.activo_nombre} ({p.ticker})</option>
                      ))}
                    </select>
                  </div>
                  <div className="formField">
                    <label>Fecha</label>
                    <input type="date" value={divFecha} onChange={(e) => setDivFecha(e.target.value)} required />
                  </div>
                  <div className="formField">
                    <label>Importe</label>
                    <input type="number" min="0" step="0.0001" value={divImporte}
                      onChange={(e) => setDivImporte(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div className="formField">
                    <label>Moneda</label>
                    <select value={divMonedaId} onChange={(e) => setDivMonedaId(e.target.value)}>
                      <option value="">Moneda del portafolio</option>
                      {monedas.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre} ({m.ticker})</option>
                      ))}
                    </select>
                  </div>
                  <div className="formField">
                    <label>Observacion</label>
                    <input value={divObservacion} onChange={(e) => setDivObservacion(e.target.value)}
                      placeholder="Opcional" />
                  </div>
                  <div className="actionsRow">
                    <button type="submit" className="buttonPrimary" disabled={loading}>
                      {loading ? "Guardando..." : "Registrar"}
                    </button>
                  </div>
                </form>
              ) : null}
              {loadingDividendos ? <p>Cargando dividendos...</p> : null}
              {dividendos.length > 0 ? (
                <>
                  <div className="dividendoResumen">
                    <div className="dividendoResumenItem">
                      <span className="dividendoResumenLabel">Total año actual</span>
                      <span className="dividendoResumenValue">{dividendosTotalAnio.toFixed(2)}</span>
                    </div>
                    <div className="dividendoResumenItem">
                      <span className="dividendoResumenLabel">Total historico</span>
                      <span className="dividendoResumenValue">{dividendosTotalHistorico.toFixed(2)}</span>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr><th>Fecha</th><th>Activo</th><th>Importe</th><th>Moneda</th><th>Obs.</th><th>Acc.</th></tr>
                    </thead>
                    <tbody>
                      {dividendos.map((d) => (
                        <tr key={d.id}>
                          <td>{formatSnapshotDate(d.fecha)}</td>
                          <td>{d.activo_nombre} ({d.ticker})</td>
                          <td>{Number(d.importe || 0).toFixed(4)}</td>
                          <td>{d.moneda_ticker || "-"}</td>
                          <td>{d.observacion || "-"}</td>
                          <td className="actionsCell">
                            <button type="button" className="buttonDanger"
                              onClick={() => handleEliminarDividendo(d.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : !loadingDividendos ? (
                <p style={{ color: "var(--text-muted)" }}>No hay dividendos registrados.</p>
              ) : null}
            </section>
          ) : null}

          {(Object.keys(scenarioCategories).length > 0 || posiciones.filter(p => Number(p.cantidad||0) > 0).length > 0) ? (
            <section id="sec-portafolio-simulador">
              <h2>Simulador de escenarios</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Aplica shocks porcentuales a tus activos y visualiza el impacto inmediato y a largo plazo sobre el portafolio.
              </p>

              {/* ── 1+15: Escenarios predefinidos / Stress tests ── */}
              <div style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Escenarios históricos
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {PRESET_SCENARIOS.map((p) => (
                    <button key={p.label} type="button"
                      className="buttonSecondary"
                      style={{ fontSize: "0.73rem", padding: "3px 10px" }}
                      title={p.description}
                      onClick={() => applyPreset(p)}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                  <button type="button" className="buttonSecondary"
                    style={{ fontSize: "0.73rem", padding: "3px 10px" }}
                    title="Genera un escenario de mercado aleatorio pero coherente: distribución realista con correlaciones por beta"
                    onClick={applyRandomShock}>
                    🎲 Aleatorio coherente
                  </button>
                  <button type="button" className="buttonSecondary"
                    style={{ fontSize: "0.73rem", padding: "3px 10px", marginLeft: "auto" }}
                    onClick={() => setScenarioShocks({})}>
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* ── Shocks + Resultado + Gráfico de impacto ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <strong style={{ fontSize: "0.82rem", display: "block", marginBottom: 8 }}>
                    Shocks por posición
                  </strong>
                  {posiciones.filter((p) => Number(p.cantidad || 0) > 0).map((p) => {
                    const key = String(p.id);
                    const shock = Number(effectiveShocks[key] || 0);
                    return (
                      <div key={key} className="scenarioSliderRow">
                        <label style={{ minWidth: 90, fontSize: "0.76rem" }} title={p.activo_nombre || p.ticker}>
                          {(p.ticker || p.activo_nombre || "?").slice(0, 10)}
                        </label>
                        <input type="range" min="-80" max="80" step="1" value={shock}
                          onChange={(e) => setScenarioShocks((prev) => ({ ...prev, [key]: Number(e.target.value) }))} />
                        <input type="number" min="-80" max="80" step="1" value={shock}
                          onChange={(e) => setScenarioShocks((prev) => ({ ...prev, [key]: Math.max(-80, Math.min(80, Number(e.target.value))) }))}
                          style={{ width: 54, padding: "2px 4px", fontSize: "0.78rem", textAlign: "right" }} />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 12 }}>%</span>
                      </div>
                    );
                  })}
                  {/* ── Resultado + 13: VaR dinámico ── */}
                  <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                      Valor actual: <strong>{scenarioCurrentTotal.toFixed(2)}</strong>
                    </div>
                    <div className="scenarioResult" style={{ color: scenarioResultFinal >= scenarioCurrentTotal ? "var(--green-600)" : "var(--red-600)" }}>
                      {scenarioResultFinal.toFixed(2)}
                      <span style={{ fontSize: "0.88rem", marginLeft: 8 }}>
                        ({scenarioCurrentTotal > 0 ? ((scenarioResultFinal - scenarioCurrentTotal) / scenarioCurrentTotal * 100).toFixed(2) : 0}%)
                      </span>
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Diferencia: {(scenarioResultFinal - scenarioCurrentTotal) >= 0 ? "+" : ""}{(scenarioResultFinal - scenarioCurrentTotal).toFixed(2)}
                    </div>
                    {dynamicVar95 !== null ? (
                      <div style={{ fontSize: "0.73rem", color: "var(--amber-600)", marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                        VaR 95% diario post-shock: <strong>-{dynamicVar95.toFixed(2)}</strong>
                        <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>
                          (pérdida máxima diaria esperada con 95% de confianza)
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: "0.82rem" }}>Impacto por posición</strong>
                  <div className="chartWrap" style={{ marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height={Math.max(180, scenarioBarData.length * 26)}>
                      <BarChart data={scenarioBarData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0)+"k" : String(v)} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
                        <Tooltip formatter={(v) => [v.toLocaleString("es-ES", { maximumFractionDigits: 0 })]} />
                        <Legend wrapperStyle={{ fontSize: "0.73rem" }} />
                        <Bar dataKey="actual" name="Actual" fill="#3b82f6" />
                        <Bar dataKey="escenario" name="Escenario" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ── 14: Advertencias de inconsistencia ── */}
              {scenarioWarnings.length > 0 ? (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--amber-50)", border: "1px solid var(--amber-500)", borderRadius: "var(--radius-md)" }}>
                  <strong style={{ fontSize: "0.78rem", color: "var(--amber-600)" }}>⚠ Advertencias de consistencia</strong>
                  {scenarioWarnings.map((w, i) => (
                    <p key={i} style={{ fontSize: "0.75rem", color: "var(--amber-600)", margin: "4px 0 0" }}>{w}</p>
                  ))}
                </div>
              ) : null}

              {/* ── Toggles de vistas adicionales ── */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                <button type="button"
                  className={`buttonSecondary chartToggleButton${showImpactTable ? " chartToggleButtonActive" : ""}`}
                  style={{ fontSize: "0.73rem" }}
                  onClick={() => setShowImpactTable((p) => !p)}>
                  Tabla de impacto
                </button>
                <button type="button"
                  className={`buttonSecondary chartToggleButton${showWaterfall ? " chartToggleButtonActive" : ""}`}
                  style={{ fontSize: "0.73rem" }}
                  onClick={() => setShowWaterfall((p) => !p)}>
                  Gráfico cascada
                </button>
                <button type="button"
                  className={`buttonSecondary chartToggleButton${showScenarioTreemap ? " chartToggleButtonActive" : ""}`}
                  style={{ fontSize: "0.73rem" }}
                  onClick={() => setShowScenarioTreemap((p) => !p)}>
                  Mapa de impacto
                </button>
                <button type="button"
                  className={`buttonSecondary chartToggleButton${showSavedScenarios ? " chartToggleButtonActive" : ""}`}
                  style={{ fontSize: "0.73rem" }}
                  onClick={() => setShowSavedScenarios((p) => !p)}>
                  Escenarios guardados {savedScenarios.length > 0 ? `(${savedScenarios.length})` : ""}
                </button>
              </div>

              {/* ── 4: Tabla de impacto detallada ── */}
              {showImpactTable && impactTableData.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ fontSize: "0.82rem" }}>Tabla de impacto detallada</strong>
                  <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Activo / Categoría</th>
                          <th>Shock %</th>
                          <th>Valor actual</th>
                          <th>Valor escenario</th>
                          <th>Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {impactTableData.map((row, i) => (
                          <tr key={i}>
                            <td>{row.name}</td>
                            <td style={{ color: row.shockPct > 0 ? "var(--green-600)" : row.shockPct < 0 ? "var(--red-600)" : "var(--text-muted)", fontWeight: 600 }}>
                              {row.shockPct > 0 ? "+" : ""}{row.shockPct.toFixed(1)}%
                            </td>
                            <td>{row.actual.toFixed(2)}</td>
                            <td>{row.escenario.toFixed(2)}</td>
                            <td style={{ color: row.delta >= 0 ? "var(--green-600)" : "var(--red-600)", fontWeight: 600 }}>
                              {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border-strong)" }}>
                          <td colSpan={2}>Total</td>
                          <td>{scenarioCurrentTotal.toFixed(2)}</td>
                          <td>{scenarioResultFinal.toFixed(2)}</td>
                          <td style={{ color: (scenarioResultFinal - scenarioCurrentTotal) >= 0 ? "var(--green-600)" : "var(--red-600)" }}>
                            {(scenarioResultFinal - scenarioCurrentTotal) >= 0 ? "+" : ""}{(scenarioResultFinal - scenarioCurrentTotal).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* ── 5: Gráfico cascada (waterfall) ── */}
              {showWaterfall && waterfallData.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ fontSize: "0.82rem" }}>Contribución al cambio (cascada)</strong>
                  <div className="chartWrap" style={{ marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height={Math.max(160, waterfallData.length * 24)}>
                      <BarChart data={waterfallData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0)+"k" : String(v)} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip formatter={(v) => [(v >= 0 ? "+" : "") + v.toLocaleString("es-ES", { maximumFractionDigits: 0 })]} />
                        <Bar dataKey="delta" name="Cambio">
                          {waterfallData.map((entry, index) => (
                            <Cell key={index} fill={entry.delta >= 0 ? "#16a34a" : "#dc2626"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}

              {/* ── 6: Mapa de impacto (Treemap) ── */}
              {showScenarioTreemap && scenarioTreemapData.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ fontSize: "0.82rem" }}>Mapa de impacto — tamaño = valor, color = shock</strong>
                  <div className="chartWrap" style={{ marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      <Treemap
                        data={scenarioTreemapData}
                        dataKey="size"
                        nameKey="name"
                        content={({ x, y, width, height, name, shock }) => {
                          const shockVal = Number(shock || 0);
                          const intensity = Math.min(Math.abs(shockVal) / 50, 1);
                          const fill = shockVal > 0
                            ? `rgba(22,163,74,${0.25 + intensity * 0.65})`
                            : shockVal < 0 ? `rgba(220,38,38,${0.25 + intensity * 0.65})`
                            : "var(--bg-subtle)";
                          return (
                            <g>
                              <rect x={x} y={y} width={width} height={height} fill={fill} stroke="var(--bg-surface)" strokeWidth={2} rx={3} />
                              {width > 40 && height > 22 ? (
                                <>
                                  <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={700}>{name}</text>
                                  <text x={x + width / 2} y={y + height / 2 + 9} textAnchor="middle" fontSize={9} fill="#fff">
                                    {shockVal > 0 ? "+" : ""}{shockVal.toFixed(1)}%
                                  </text>
                                </>
                              ) : null}
                            </g>
                          );
                        }}
                      />
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: "rgba(22,163,74,0.8)", borderRadius: 2, display: "inline-block" }} /> Subida</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: "rgba(220,38,38,0.8)", borderRadius: 2, display: "inline-block" }} /> Bajada</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 2, display: "inline-block" }} /> Sin shock</span>
                  </div>
                </div>
              ) : null}

              {/* ── 10: Impacto en objetivos ── */}
              {objetivosImpact.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <strong style={{ fontSize: "0.82rem" }}>Impacto en tus objetivos financieros</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                    {objetivosImpact.map((obj) => (
                      <div key={obj.id} style={{ flex: "1 1 220px", padding: "10px 12px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 4 }}>{obj.nombre}</div>
                        <div style={{ display: "flex", gap: 12, fontSize: "0.73rem" }}>
                          <div>
                            <div style={{ color: "var(--text-muted)" }}>Actual</div>
                            <div style={{ fontWeight: 600 }}>{obj.progActual.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)" }}>Escenario</div>
                            <div style={{ fontWeight: 600, color: obj.delta >= 0 ? "var(--green-600)" : "var(--red-600)" }}>
                              {obj.progEscenario.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--text-muted)" }}>Cambio</div>
                            <div style={{ fontWeight: 600, color: obj.delta >= 0 ? "var(--green-600)" : "var(--red-600)" }}>
                              {obj.delta >= 0 ? "+" : ""}{obj.delta.toFixed(1)} pp
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* ── 12: Guardar y comparar escenarios ── */}
              {showSavedScenarios ? (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <strong style={{ fontSize: "0.82rem" }}>Guardar escenario actual</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                    <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Nombre del escenario…"
                      style={{ flex: 1, padding: "4px 8px", fontSize: "0.8rem" }} />
                    <button type="button" className="buttonPrimary"
                      style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                      disabled={!scenarioName.trim()}
                      onClick={() => {
                        setSavedScenarios((prev) => [...prev, {
                          id: Date.now(),
                          name: scenarioName.trim(),
                          mode: scenarioMode,
                          shocks: { ...effectiveShocks },
                          result: scenarioResultFinal,
                          current: scenarioCurrentTotal,
                          pct: scenarioCurrentTotal > 0 ? ((scenarioResultFinal - scenarioCurrentTotal) / scenarioCurrentTotal * 100) : 0,
                        }]);
                        setScenarioName("");
                      }}>
                      Guardar
                    </button>
                  </div>
                  {savedScenarios.length > 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Escenarios guardados</strong>
                      <table className="table" style={{ marginTop: 6 }}>
                        <thead>
                          <tr><th>Nombre</th><th>Modo</th><th>Resultado</th><th>%</th><th></th></tr>
                        </thead>
                        <tbody>
                          {savedScenarios.map((sc) => (
                            <tr key={sc.id}>
                              <td>{sc.name}</td>
                              <td>{sc.mode === "category" ? "Categoría" : "Posición"}</td>
                              <td>{sc.result.toFixed(2)}</td>
                              <td style={{ color: sc.pct >= 0 ? "var(--green-600)" : "var(--red-600)", fontWeight: 600 }}>
                                {sc.pct >= 0 ? "+" : ""}{sc.pct.toFixed(2)}%
                              </td>
                              <td className="actionsCell">
                                <button type="button" className="buttonSecondary" style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                                  onClick={() => { setScenarioMode(sc.mode); setScenarioShocks(sc.shocks); }}>
                                  Aplicar
                                </button>
                                <button type="button" className="buttonDanger" style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                                  onClick={() => setSavedScenarios((prev) => prev.filter((s) => s.id !== sc.id))}>
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {savedScenarios.length >= 2 ? (
                        <div style={{ marginTop: 10 }}>
                          <strong style={{ fontSize: "0.78rem" }}>Comparativa de escenarios guardados</strong>
                          <div className="chartWrap" style={{ marginTop: 6 }}>
                            <ResponsiveContainer width="100%" height={Math.max(120, savedScenarios.length * 32)}>
                              <BarChart data={savedScenarios.map((s) => ({ name: s.name, pct: Number(s.pct.toFixed(2)) }))}
                                layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => v + "%"} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                                <Tooltip formatter={(v) => [v + "%", "Variación"]} />
                                <Bar dataKey="pct" name="Variación %">
                                  {savedScenarios.map((s, i) => (
                                    <Cell key={i} fill={s.pct >= 0 ? "#16a34a" : "#dc2626"} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ── Monte Carlo (features 3,7,8,9,11) ── */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Monte Carlo</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", cursor: "help", borderBottom: "1px dotted var(--text-muted)" }}
                    title="Movimiento Browniano Geométrico (GBM): simula la evolución del portafolio asumiendo que los retornos siguen una distribución log-normal. En cada paso mensual: V(t+1) = V(t) · exp((μ - σ²/2)·dt + σ·√dt·Z), donde Z ~ N(0,1). Es el modelo estándar en finanzas cuantitativas (Black-Scholes). Los parámetros μ (retorno) y σ (volatilidad) se estiman de los snapshots históricos.">
                    ¿Qué es GBM? ⓘ
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: "0.78rem", alignItems: "center", marginBottom: 10 }}>
                  <label>Años:
                    <input type="number" min="1" max="40" value={monteCarloYears}
                      onChange={(e) => setMonteCarloYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                      style={{ width: 52, padding: "2px 4px", marginLeft: 4 }} />
                  </label>
                  <label>Simulaciones:
                    <select value={monteCarloRuns} onChange={(e) => setMonteCarloRuns(Number(e.target.value))}
                      style={{ padding: "2px 4px", fontSize: "0.78rem", marginLeft: 4 }}>
                      <option value="200">200</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
                    </select>
                  </label>
                  <label title="Aportación mensual adicional">Aportación/mes:
                    <input type="number" min="0" step="50" value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                      style={{ width: 72, padding: "2px 4px", marginLeft: 4 }} />
                  </label>
                  <label title="Rentabilidad por dividendos anual estimada">Div. yield %:
                    <input type="number" min="0" max="20" step="0.1" value={dividendYieldPct}
                      onChange={(e) => setDividendYieldPct(Math.max(0, Math.min(20, Number(e.target.value))))}
                      style={{ width: 56, padding: "2px 4px", marginLeft: 4 }} />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4 }} title="Compara con rebalanceo anual (reduce volatilidad ~12%)">
                    <input type="checkbox" checked={showMcRebalancing}
                      onChange={(e) => setShowMcRebalancing(e.target.checked)} />
                    Con rebalanceo
                  </label>
                </div>

                {riskMetrics ? (
                  <>
                    {/* Parámetros de simulación */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 10, padding: "8px 12px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "0.78rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <label style={{ color: "var(--text-muted)" }}
                          title="Retorno anual usado en la simulación. Por defecto usa el calculado de los snapshots.">
                          Retorno anual:
                        </label>
                        <input type="number" step="0.5" value={mcRetornoOverride}
                          placeholder={riskMetrics.annualReturn}
                          onChange={(e) => setMcRetornoOverride(e.target.value)}
                          style={{ width: 72, padding: "2px 6px", fontSize: "0.78rem" }} />
                        <span style={{ color: "var(--text-muted)" }}>%</span>
                        {mcRetornoOverride !== "" ? (
                          <button type="button" className="buttonSecondary"
                            style={{ fontSize: "0.7rem", padding: "1px 7px" }}
                            title="Usar retorno calculado de snapshots"
                            onClick={() => setMcRetornoOverride("")}>
                            ↺
                          </button>
                        ) : null}
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Volatilidad: </span>
                        <strong>{riskMetrics.volatilidad}%</strong>
                      </div>
                    </div>

                    {monteCarloData.data && monteCarloData.data.length > 0 ? (
                      <>
                        {/* Feature 3: bandas de incertidumbre + Feature 9: rebalanceo */}
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={240}>
                            <ComposedChart data={monteCarloData.data} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                              <Tooltip formatter={(v) => [v.toLocaleString("es-ES", { maximumFractionDigits: 0 })]} />
                              <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
                              {/* Banda P10-P90 */}
                              <Area type="monotone" dataKey="p90" name="P10–P90" fill="rgba(59,130,246,0.08)" stroke="none" legendType="none" />
                              <Area type="monotone" dataKey="p10" name="_" fill="var(--bg-surface)" stroke="none" legendType="none" />
                              {/* Banda P25-P75 */}
                              <Area type="monotone" dataKey="p75" name="P25–P75" fill="rgba(59,130,246,0.14)" stroke="none" legendType="none" />
                              <Area type="monotone" dataKey="p25" name="_2" fill="var(--bg-surface)" stroke="none" legendType="none" />
                              <Line type="monotone" dataKey="p10" name="P10 (pesimista)" stroke="#dc2626" strokeDasharray="4 2" dot={false} />
                              <Line type="monotone" dataKey="p50" name="P50 (mediana)" stroke="#3b82f6" strokeWidth={2.4} dot={false} />
                              <Line type="monotone" dataKey="p90" name="P90 (optimista)" stroke="#16a34a" strokeDasharray="4 2" dot={false} />
                              {showMcRebalancing && monteCarloData.rebal?.data ? (
                                <Line data={monteCarloData.rebal.data} type="monotone" dataKey="p50" name="P50 con rebalanceo" stroke="#7c3aed" strokeWidth={1.6} strokeDasharray="6 3" dot={false} />
                              ) : null}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Percentiles finales */}
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
                          {[["P10", monteCarloData.p10, "var(--red-600)"], ["P25", monteCarloData.p25, "var(--amber-600)"], ["P50", monteCarloData.p50, "var(--blue-600)"], ["P75", monteCarloData.p75, "var(--green-600)"], ["P90", monteCarloData.p90, "var(--green-700)"]].map(([label, val, color]) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</span>
                              <span style={{ fontWeight: 700, color, fontSize: "0.9rem" }}>{Number(val).toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>
                            </div>
                          ))}
                          {showMcRebalancing && monteCarloData.rebal ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "uppercase" }}>P50 rebal.</span>
                              <span style={{ fontWeight: 700, color: "var(--violet-600)", fontSize: "0.9rem" }}>
                                {Number(monteCarloData.rebal.p50).toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Feature 7: probabilidad de ruina */}
                        <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "0.8rem" }}>Probabilidad de caída</strong>
                            <label style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 6 }}>
                              Umbral: el portafolio cae por debajo del
                              <input type="number" min="1" max="99" step="5" value={ruinThreshold}
                                onChange={(e) => setRuinThreshold(Math.max(1, Math.min(99, Number(e.target.value))))}
                                style={{ width: 52, padding: "2px 4px", fontSize: "0.78rem" }} />
                              % del valor actual ({(scenarioCurrentTotal * ruinThreshold / 100).toFixed(0)})
                            </label>
                          </div>
                          {typeof monteCarloData.ruinProb === "number" ? (
                            <div style={{ marginTop: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Sin rebalanceo</div>
                                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: monteCarloData.ruinProb > 20 ? "var(--red-600)" : monteCarloData.ruinProb > 10 ? "var(--amber-600)" : "var(--green-600)" }}>
                                  {monteCarloData.ruinProb.toFixed(1)}%
                                </div>
                              </div>
                              {showMcRebalancing && monteCarloData.rebal ? (
                                <div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Con rebalanceo</div>
                                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: monteCarloData.rebal.ruinProb > 20 ? "var(--red-600)" : monteCarloData.rebal.ruinProb > 10 ? "var(--amber-600)" : "var(--green-600)" }}>
                                    {monteCarloData.rebal.ruinProb.toFixed(1)}%
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6, marginBottom: 0 }}>
                            % de simulaciones en que el portafolio queda por debajo del umbral al cabo de {monteCarloYears} años.
                          </p>
                        </div>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Se necesitan snapshots históricos para calcular retorno y volatilidad.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "noticias" ? (
        <>
          <div className="listHeader">
            <h1>Noticias</h1>
            <button
              type="button"
              className="buttonSecondary"
              onClick={() => loadNoticiasData()}
              disabled={loadingNoticias}
            >
              {loadingNoticias ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
          {noticiasFetchedAt ? (
            <p className="newsMeta">Ultima actualizacion: {formatNewsDateTime(noticiasFetchedAt)}</p>
          ) : null}
          <section>
            <h2>Mas recientes de Yahoo Finance</h2>
            {loadingNoticias && noticiasRecientes.length === 0 ? <p>Cargando noticias...</p> : null}
            <div className="newsGrid">
              {noticiasRecientes.length === 0 ? (
                <p className="chartNoData">No hay noticias recientes disponibles.</p>
              ) : (
                noticiasRecientes.map((news) => (
                  <article key={`recent-${news.id}`} className="newsCard">
                    <h3>
                      <a href={news.enlace} target="_blank" rel="noreferrer">
                        {news.titulo}
                      </a>
                    </h3>
                    <p className="newsMeta">
                      {news.proveedor || "Yahoo Finance"} - {formatNewsDateTime(news.publicado_en)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "cashflow" ? (
        <>
          <h1>Cashflow</h1>

          <section className="cashflowTopBar">
            <div className="cashflowNetBalance">
              <p>Saldo neto</p>
              <h2>
                {Number(cashFlowResumen?.saldo_neto || 0).toFixed(2)}{" "}
                {cashFlowResumen?.moneda_ticker || monedaResumenTicker || ""}
              </h2>
            </div>
          </section>

          <section id="sec-cashflow-graficos">
            <h2>Graficos de cashflow</h2>
            <div className="dashboardChartsGrid">
              <article className="chartCard">
                <h3>Categorias de ingresos ({cashFlowCalendarMonthLabel})</h3>
                {cashFlowCategoriasIngresosMes.length === 0 ? (
                  <p className="chartNoData">No hay ingresos para este mes.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={cashFlowCategoriasIngresosMes}
                          dataKey="valor"
                          nameKey="categoria"
                          outerRadius={88}
                          labelLine={false}
                          label={renderPiePercentLabel}
                        >
                          {cashFlowCategoriasIngresosMes.map((entry, index) => (
                            <Cell
                              key={`cf-ingreso-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={buildPiePercentTooltipFormatter(cashFlowCategoriasIngresosMesTotal)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard">
                <h3>Categorias de gastos ({cashFlowCalendarMonthLabel})</h3>
                {cashFlowCategoriasGastosMes.length === 0 ? (
                  <p className="chartNoData">No hay gastos para este mes.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={cashFlowCategoriasGastosMes}
                          dataKey="valor"
                          nameKey="categoria"
                          outerRadius={88}
                          labelLine={false}
                          label={renderPiePercentLabel}
                        >
                          {cashFlowCategoriasGastosMes.map((entry, index) => (
                            <Cell
                              key={`cf-gasto-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={buildPiePercentTooltipFormatter(cashFlowCategoriasGastosMesTotal)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard chartCardWide">
                <h3>Ingresos y gastos mensuales ({cashFlowCalendarYear})</h3>
                <div className="chartWrap">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashFlowMensualAnualData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value || 0).toFixed(2)} ${cashFlowCurrencyTicker}`,
                          "Importe"
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" />
                      <Bar dataKey="gastos" name="Gastos" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="chartCard chartCardWide">
                <h3>Evolucion del saldo neto</h3>
                {cashFlowSaldoNetoEvolutionData.length === 0 ? (
                  <p className="chartNoData">No hay datos para calcular el saldo neto.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={cashFlowSaldoNetoEvolutionData.slice(-180)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value || 0).toFixed(2)} ${cashFlowCurrencyTicker}`,
                            "Saldo neto"
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          name="Saldo neto acumulado"
                          stroke="#0f172a"
                          strokeWidth={2.4}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section id="sec-cashflow-calendario" className="cashflowCalendarSection">
            <div className="cashflowCalendarHeader">
              <div>
                <h2>Calendario de movimientos</h2>
                <p className="cashflowCalendarMonth">{cashFlowCalendarMonthLabel}</p>
              </div>
              <div className="cashflowCalendarNav">
                <button
                  type="button"
                  className="buttonSecondary cashflowCalendarNavButton"
                  onClick={() => handleCashFlowCalendarMonthChange(-1)}
                  aria-label="Mes anterior"
                  title="Mes anterior"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  className="buttonSecondary cashflowCalendarNavButton"
                  onClick={() => handleCashFlowCalendarMonthChange(1)}
                  aria-label="Mes siguiente"
                  title="Mes siguiente"
                >
                  {">"}
                </button>
              </div>
            </div>
            <div className="cashflowCalendarGrid">
              {["L", "M", "X", "J", "V", "S", "D"].map((dayLabel) => (
                <div key={dayLabel} className="cashflowCalendarWeekday">
                  {dayLabel}
                </div>
              ))}
              {cashFlowCalendarCells.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="cashflowCalendarCellEmpty" />;
                }
                const signals = cashFlowCalendarDaySignals[day] || {
                  hasIngreso: false,
                  hasGasto: false
                };
                const dateKey = buildCashFlowDateKey(cashFlowCalendarYear, cashFlowCalendarMonth, day);
                const isToday =
                  day === cashFlowCalendarNow.getDate() &&
                  cashFlowCalendarMonth === cashFlowCalendarNow.getMonth() &&
                  cashFlowCalendarYear === cashFlowCalendarNow.getFullYear();
                const isSelected = cashFlowSelectedDate === dateKey;
                return (
                  <button
                    type="button"
                    key={`day-${day}`}
                    className={`cashflowCalendarCell cashflowCalendarCellButton${
                      isToday ? " cashflowCalendarCellToday" : ""
                    }${isSelected ? " cashflowCalendarCellSelected" : ""}`}
                    onClick={() => handleCashFlowCalendarDayClick(day)}
                  >
                    <span className="cashflowCalendarDayNumber">{day}</span>
                    <div className="cashflowCalendarDots">
                      {signals.hasIngreso ? (
                        <span className="cashflowCalendarDot cashflowCalendarDotIngreso" />
                      ) : null}
                      {signals.hasGasto ? (
                        <span className="cashflowCalendarDot cashflowCalendarDotGasto" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="cashflowCalendarLegend">
              <span className="cashflowCalendarLegendItem">
                <span className="cashflowCalendarDot cashflowCalendarDotIngreso" />
                Ingreso
              </span>
              <span className="cashflowCalendarLegendItem">
                <span className="cashflowCalendarDot cashflowCalendarDotGasto" />
                Gasto
              </span>
            </div>
            <div className="cashflowMonthTotals">
              <button
                type="button"
                className={`cashflowMonthTotalCard${
                  cashFlowSelectedMonthType === "ingreso" ? " cashflowMonthTotalCardActive" : ""
                }`}
                onClick={() => handleCashFlowMonthTypeClick("ingreso")}
              >
                <span>Total ingresos del mes</span>
                <strong>{cashFlowMonthTotalIngresos.toFixed(2)}</strong>
              </button>
              <button
                type="button"
                className={`cashflowMonthTotalCard${
                  cashFlowSelectedMonthType === "gasto" ? " cashflowMonthTotalCardActive" : ""
                }`}
                onClick={() => handleCashFlowMonthTypeClick("gasto")}
              >
                <span>Total gastos del mes</span>
                <strong>{cashFlowMonthTotalGastos.toFixed(2)}</strong>
              </button>
            </div>
            {cashFlowSelectedDate ? (
              <div className="cashflowDayDetail">
                <h3>Movimientos del {selectedCashFlowDayLabel}</h3>
                {selectedCashFlowDayMovements.length === 0 ? (
                  <p>No hay movimientos para este dia.</p>
                ) : (
                  <ul className="cashflowDayList">
                    {selectedCashFlowDayMovements.map((movement) => (
                      <li key={`day-${movement.id}`}>
                        <strong>{movement.tipo}</strong> -{" "}
                        {formatCashFlowCategoria(movement.categoria)} -{" "}
                        {movement.nombre} -{" "}
                        {getCashFlowOriginalAmount(movement).toFixed(2)}{" "}
                        {getCashFlowOriginalTicker(movement)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : cashFlowSelectedMonthType ? (
              <div className="cashflowDayDetail">
                <h3>
                  {cashFlowSelectedMonthType === "ingreso" ? "Ingresos" : "Gastos"} de{" "}
                  {cashFlowCalendarMonthLabel}
                </h3>
                {selectedCashFlowMonthTypeMovements.length === 0 ? (
                  <p>
                    No hay {cashFlowSelectedMonthType === "ingreso" ? "ingresos" : "gastos"} para
                    este mes.
                  </p>
                ) : (
                  <ul className="cashflowDayList">
                    {selectedCashFlowMonthTypeMovements.map((movement) => (
                      <li key={`month-${movement.id}`}>
                        <strong>{formatCashFlowCategoria(movement.categoria)}</strong> -{" "}
                        {movement.nombre} -{" "}
                        {String(movement.fecha || "").slice(0, 10)} -{" "}
                        {getCashFlowOriginalAmount(movement).toFixed(2)}{" "}
                        {getCashFlowOriginalTicker(movement)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="cashflowDayHint">Pulsa un dia para ver sus movimientos.</p>
            )}
          </section>

          <section id="sec-cashflow-movimientos">
            <div className="listHeader">
              <h2>Ultimos movimientos</h2>
              <button
                type="button"
                className={`buttonSecondary iconToggleButton${
                  showCashFlowForm ? " iconToggleButtonOpen" : ""
                }`}
                onClick={() => setShowCashFlowForm((prev) => !prev)}
                title={
                  showCashFlowForm ? "Ocultar formulario de cashflow" : "Mostrar formulario de cashflow"
                }
                aria-label={
                  showCashFlowForm ? "Ocultar formulario de cashflow" : "Mostrar formulario de cashflow"
                }
              >
                <img src="/buttons/add.svg" alt="" aria-hidden="true" className="iconToggleImage" />
              </button>
            </div>
            {showCashFlowForm ? (
              <>
                <h3 className="cashflowFormTitle">
                  {editingCashFlowId ? "Editar movimiento" : "Crear movimiento"}
                </h3>
                <form onSubmit={handleCashFlowSubmit} className="form cashflowCompactForm">
                  <div className="cashflowField cashflowFieldTipo">
                    <label htmlFor="cashFlowTipo">Tipo</label>
                    <select
                      id="cashFlowTipo"
                      value={cashFlowTipo}
                      onChange={(e) => setCashFlowTipo(e.target.value)}
                      required
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                    </select>
                  </div>

                  <div className="cashflowField cashflowFieldCategoria">
                    <label htmlFor="cashFlowCategoria">Categoria</label>
                    <select
                      id="cashFlowCategoria"
                      value={cashFlowCategoria}
                      onChange={(e) => setCashFlowCategoria(e.target.value)}
                      required
                    >
                      {CASHFLOW_CATEGORIAS.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {formatCashFlowCategoria(categoria)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cashflowField cashflowFieldNombre">
                    <label htmlFor="cashFlowNombre">Nombre</label>
                    <input
                      id="cashFlowNombre"
                      value={cashFlowNombre}
                      onChange={(e) => setCashFlowNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cashflowField cashflowFieldFecha">
                    <label htmlFor="cashFlowFecha">Fecha</label>
                    <input
                      id="cashFlowFecha"
                      type="date"
                      value={cashFlowFecha}
                      onChange={(e) => setCashFlowFecha(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cashflowField cashflowFieldImporte">
                    <label htmlFor="cashFlowAporte">Importe</label>
                    <input
                      id="cashFlowAporte"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={cashFlowAporte}
                      onChange={(e) => setCashFlowAporte(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cashflowField cashflowFieldMoneda">
                    <label htmlFor="cashFlowMoneda">Moneda</label>
                    <select
                      id="cashFlowMoneda"
                      value={cashFlowMonedaId}
                      onChange={(e) => setCashFlowMonedaId(e.target.value)}
                    >
                      <option value="">Moneda del usuario</option>
                      {monedas.map((moneda) => (
                        <option key={moneda.id} value={moneda.id}>
                          {moneda.nombre} {moneda.ticker ? `(${moneda.ticker})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cashflowField cashflowFieldObservacion">
                    <label htmlFor="cashFlowObservacion">Observacion</label>
                    <input
                      id="cashFlowObservacion"
                      value={cashFlowObservacion}
                      onChange={(e) => setCashFlowObservacion(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="actionsRow cashflowFormActions">
                    <button type="submit" disabled={loading}>
                      {loading ? "Procesando..." : editingCashFlowId ? "Guardar cambios" : "Crear"}
                    </button>
                    {editingCashFlowId ? (
                      <button type="button" className="buttonSecondary" onClick={clearCashFlowForm}>
                        Cancelar edicion
                      </button>
                    ) : null}
                  </div>
                </form>
              </>
            ) : null}
            {loadingCashFlow ? <p>Cargando cashflow...</p> : null}
            <table className="table">
              <thead>
                <tr>
                  <th aria-label="Tipo"></th>
                  <th>Categoria</th>
                  <th>Nombre</th>
                  <th>Fecha</th>
                  <th>Importe</th>
                  <th>Observacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedCashFlows.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay movimientos de cashflow</td>
                  </tr>
                ) : (
                  pagedMovimientos.map((cashFlow, index) => {
                    const dateKey = cashFlow.fecha ? String(cashFlow.fecha).slice(0, 10) : "";
                    const prevDateKey =
                      index > 0 && pagedMovimientos[index - 1]?.fecha
                        ? String(pagedMovimientos[index - 1].fecha).slice(0, 10)
                        : "";
                    const showDateSeparator = index === 0 || dateKey !== prevDateKey;
                    return (
                      <Fragment key={cashFlow.id}>
                        {showDateSeparator ? (
                          <tr className="snapshotDateSeparatorRow">
                            <td colSpan="7">
                              Fecha: {dateKey ? formatSnapshotDate(dateKey) : "-"}
                            </td>
                          </tr>
                        ) : null}
                        <tr>
                          <td>
                            {String(cashFlow.tipo || "").toLowerCase() === "gasto"
                              ? renderDirectionBadge("left", "Gasto", "Expense")
                              : renderDirectionBadge("right", "Ingreso", "Income")}
                          </td>
                          <td>{formatCashFlowCategoria(cashFlow.categoria)}</td>
                          <td>{cashFlow.nombre}</td>
                          <td>{dateKey || "-"}</td>
                          <td>
                            {getCashFlowOriginalAmount(cashFlow).toFixed(2)}{" "}
                            {getCashFlowOriginalTicker(cashFlow)}
                          </td>
                          <td>{cashFlow.observacion || "-"}</td>
                          <td className="actionsCell">
                            <button
                              type="button"
                              className="buttonSecondary iconActionButton"
                              onClick={() => startEditCashFlow(cashFlow)}
                              title="Editar"
                              aria-label="Editar"
                            >
                              <img
                                src="/buttons/edit.svg"
                                alt=""
                                aria-hidden="true"
                                className="iconActionImage"
                              />
                            </button>
                            <button
                              type="button"
                              className="buttonDanger iconActionButton"
                              onClick={() => handleDeleteCashFlow(cashFlow.id)}
                              title="Eliminar"
                              aria-label="Eliminar"
                            >
                              <img
                                src="/buttons/delete.svg"
                                alt=""
                                aria-hidden="true"
                                className="iconActionImage"
                              />
                            </button>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
            {renderPagination(currentMovimientosPage, totalMovimientosPages, setMovimientosPage)}
          </section>
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "watchlist" ? (
        <>
          <h1>Watchlist</h1>

          <section id="sec-watchlist-watchlist">
            <div className="listHeader">
              <h2>Activos seguidos</h2>
              <button type="button" className="buttonSecondary"
                onClick={() => setShowWatchlistForm((prev) => !prev)}>
                {showWatchlistForm ? "Cancelar" : "+ Añadir"}
              </button>
            </div>
            {showWatchlistForm ? (
              <div className="form" style={{ maxWidth: 420, marginBottom: 16 }}>
                <div className="formField">
                  <label>Ticker (Yahoo Finance)</label>
                  <div className="actionsRow">
                    <input value={watchlistActivoTicker}
                      onChange={(e) => setWatchlistActivoTicker(e.target.value.toUpperCase())}
                      placeholder="Ej: AAPL, MSFT, BTC-USD" />
                    <button type="button" className="buttonPrimary" disabled={loading}
                      onClick={handleCrearWatchlistItem}>
                      {loading ? "Añadiendo..." : "Añadir"}
                    </button>
                  </div>
                </div>
                <div className="formField">
                  <label>Nota (opcional)</label>
                  <input value={watchlistNota} onChange={(e) => setWatchlistNota(e.target.value)}
                    placeholder="Razón para seguir este activo..." />
                </div>
              </div>
            ) : null}
            {loadingWatchlist ? <p>Cargando watchlist...</p> : null}
            {watchlist.length === 0 && !loadingWatchlist ? (
              <p style={{ color: "var(--text-muted)" }}>
                No tienes activos en la watchlist. Añade un ticker para empezar a seguirlo.
              </p>
            ) : (
              <div className="watchlistGrid">
                {watchlist.map((item) => {
                  const v = Number(item.variacion_porcentual || 0);
                  return (
                    <div key={item.id} className="watchlistCard">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div className="watchlistCardTicker">{item.ticker}</div>
                          <div className="watchlistCardName">{item.activo_nombre}</div>
                        </div>
                        <button type="button" className="buttonDanger"
                          style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                          onClick={() => handleEliminarWatchlistItem(item.id)}>✕</button>
                      </div>
                      {item.precio_actual != null ? (
                        <>
                          <div className="watchlistCardPrice">{Number(item.precio_actual).toFixed(4)}</div>
                          <div className="watchlistCardChange"
                            style={{ color: v >= 0 ? "var(--green-600)" : "var(--red-600)" }}>
                            {v >= 0 ? "▲" : "▼"} {Math.abs(v).toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sin datos de mercado</div>
                      )}
                      {item.nota ? (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                          {item.nota}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section id="sec-watchlist-alertas">
            <div className="listHeader">
              <h2>Alertas de precio</h2>
              <button type="button" className="buttonSecondary"
                onClick={() => setShowAlertaForm((prev) => !prev)}>
                {showAlertaForm ? "Cancelar" : "+ Nueva alerta"}
              </button>
            </div>
            {showAlertaForm ? (
              <form onSubmit={handleCrearAlerta} className="form" style={{ maxWidth: 420, marginBottom: 16 }}>
                <div className="formField">
                  <label>Activo</label>
                  <select value={alertaActivoId} onChange={(e) => setAlertaActivoId(e.target.value)} required>
                    <option value="">Selecciona un activo</option>
                    {activos.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre} ({a.ticker})</option>
                    ))}
                  </select>
                </div>
                <div className="formField">
                  <label>Condicion</label>
                  <select value={alertaTipo} onChange={(e) => setAlertaTipo(e.target.value)}>
                    <option value="mayor">Precio mayor que</option>
                    <option value="menor">Precio menor que</option>
                  </select>
                </div>
                <div className="formField">
                  <label>Precio objetivo</label>
                  <input type="number" min="0" step="0.0001" value={alertaPrecio}
                    onChange={(e) => setAlertaPrecio(e.target.value)} placeholder="0.00" required />
                </div>
                <button type="submit" className="buttonPrimary" disabled={loading}>
                  {loading ? "Creando..." : "Crear alerta"}
                </button>
              </form>
            ) : null}
            {loadingAlertas ? <p>Cargando alertas...</p> : null}
            {precioAlertas.length === 0 && !loadingAlertas ? (
              <p style={{ color: "var(--text-muted)" }}>No tienes alertas de precio configuradas.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Activo</th><th>Condicion</th><th>Precio obj.</th><th>Estado</th><th>Acc.</th></tr>
                </thead>
                <tbody>
                  {precioAlertas.map((alerta) => (
                    <tr key={alerta.id}>
                      <td>{alerta.activo_nombre} ({alerta.ticker})</td>
                      <td>{alerta.tipo === "mayor" ? "Precio >" : "Precio <"}</td>
                      <td>{Number(alerta.precio_objetivo).toFixed(4)}</td>
                      <td style={{ color: Number(alerta.activa) === 1 ? "var(--green-600)" : "var(--text-muted)", fontWeight: 600 }}>
                        {Number(alerta.activa) === 1 ? "Activa" : "Inactiva"}
                      </td>
                      <td className="actionsCell">
                        <button type="button" className="buttonDanger"
                          onClick={() => handleEliminarAlerta(alerta.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "objetivos" ? (
        <>
          <h1>Objetivos financieros</h1>
          <section>
            <div className="listHeader">
              <h2>Mis objetivos</h2>
              <button type="button" className="buttonSecondary"
                onClick={() => { clearObjetivoForm(); setShowObjetivoForm((prev) => !prev); }}>
                {showObjetivoForm ? "Cancelar" : "+ Nuevo objetivo"}
              </button>
            </div>
            {showObjetivoForm ? (
              <form onSubmit={handleObjetivoSubmit} className="form" style={{ maxWidth: 480, marginBottom: 16 }}>
                <div className="formField">
                  <label>Nombre del objetivo</label>
                  <input value={objNombre} onChange={(e) => setObjNombre(e.target.value)}
                    placeholder="Ej: Fondo de emergencia, FIRE, Casa..." required />
                </div>
                <div className="formField">
                  <label>Importe objetivo ({monedaResumenTicker})</label>
                  <input type="number" min="0" step="0.01" value={objMontoObjetivo}
                    onChange={(e) => setObjMontoObjetivo(e.target.value)} placeholder="200000" required />
                </div>
                <div className="formField">
                  <label>Fecha objetivo</label>
                  <input type="date" value={objFechaObjetivo}
                    onChange={(e) => setObjFechaObjetivo(e.target.value)} required />
                </div>
                <div className="formField">
                  <label>Capital inicial ({monedaResumenTicker})</label>
                  <input type="number" min="0" step="0.01" value={objMontoInicial}
                    onChange={(e) => setObjMontoInicial(e.target.value)} placeholder="0" />
                </div>
                <div className="formField">
                  <label>Portafolios objetivo</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", cursor: "pointer" }}>
                      <input type="checkbox"
                        checked={objetivoPortafolioIds.length === 0}
                        onChange={() => setObjetivoPortafolioIds([])} />
                      Total (todos los portafolios)
                    </label>
                    {portafolios.map((pf) => (
                      <label key={pf.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", cursor: "pointer" }}>
                        <input type="checkbox"
                          checked={objetivoPortafolioIds.includes(pf.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setObjetivoPortafolioIds((prev) => [...prev, pf.id]);
                            } else {
                              setObjetivoPortafolioIds((prev) => prev.filter((id) => id !== pf.id));
                            }
                          }} />
                        {pf.nombre}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="formField">
                  <label>Nota (opcional)</label>
                  <textarea className="notaTextarea" value={objNota}
                    onChange={(e) => setObjNota(e.target.value)}
                    placeholder="Descripcion o motivacion del objetivo..." />
                </div>
                <div className="actionsRow">
                  <button type="submit" className="buttonPrimary" disabled={loading}>
                    {loading ? "Guardando..." : editingObjetivoId ? "Actualizar" : "Crear objetivo"}
                  </button>
                </div>
              </form>
            ) : null}
            {loadingObjetivos ? <p>Cargando objetivos...</p> : null}
            {objetivos.length === 0 && !loadingObjetivos ? (
              <p style={{ color: "var(--text-muted)" }}>No tienes objetivos definidos. Crea uno para empezar.</p>
            ) : (
              <div className="objetivosGrid">
                {objetivos.map((obj) => {
                  const meta = Number(obj.monto_objetivo || 0);
                  const inicial = Number(obj.monto_inicial || 0);
                  const objPfIds = (() => {
                    try { return obj.portafolio_ids ? JSON.parse(obj.portafolio_ids) : []; } catch { return []; }
                  })();
                  const actual = objPfIds.length > 0
                    ? resumenes.filter((r) => objPfIds.includes(r.portafolio_id || r.id)).reduce((s, r) => s + Number(r.totalCategoriaMoneda || 0), 0)
                    : totalPortafolioValor;
                  const progreso = meta > 0 ? Math.min((actual / meta) * 100, 100) : 0;
                  const fechaObj = new Date(obj.fecha_objetivo);
                  const hoy = new Date();
                  const diasRestantes = Math.ceil((fechaObj - hoy) / (1000 * 60 * 60 * 24));
                  const ahorroMensualNecesario = diasRestantes > 0 && meta > actual
                    ? ((meta - actual) / (diasRestantes / 30)).toFixed(2)
                    : 0;
                  return (
                    <div key={obj.id} className="objetivoCard">
                      <div className="objetivoCardNombre">{obj.nombre}</div>
                      <div className="objetivoCardMeta">
                        Meta: <strong>{meta.toFixed(2)} {monedaResumenTicker}</strong> · {formatSnapshotDate(obj.fecha_objetivo)}
                      </div>
                      {objPfIds.length > 0 ? (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                          Portafolios: {portafolios.filter((p) => objPfIds.includes(p.id)).map((p) => p.nombre).join(", ") || "—"}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                          Portafolios: Todos
                        </div>
                      )}
                      <div className="objetivoProgressBar">
                        <div className="objetivoProgressFill" style={{ width: `${progreso}%`,
                          background: progreso >= 100 ? "var(--green-600)" : "var(--blue-500)" }} />
                      </div>
                      <div className="objetivoProgressPct">
                        {progreso.toFixed(1)}% completado · {actual.toFixed(0)} / {meta.toFixed(0)} {monedaResumenTicker}
                      </div>
                      {diasRestantes > 0 ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                          {diasRestantes} días restantes · Ahorro mensual necesario: <strong>{ahorroMensualNecesario} {monedaResumenTicker}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "var(--red-600)", marginTop: 4 }}>Fecha vencida</div>
                      )}
                      {obj.nota ? (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                          {obj.nota}
                        </div>
                      ) : null}
                      <div className="actionsRow" style={{ marginTop: 10, gap: 6 }}>
                        <button type="button" className="buttonSecondary"
                          style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                          onClick={() => {
                            setEditingObjetivoId(obj.id);
                            setObjNombre(obj.nombre);
                            setObjMontoObjetivo(String(obj.monto_objetivo));
                            setObjFechaObjetivo(String(obj.fecha_objetivo).slice(0, 10));
                            setObjMontoInicial(String(obj.monto_inicial || 0));
                            setObjNota(obj.nota || "");
                            try { setObjetivoPortafolioIds(obj.portafolio_ids ? JSON.parse(obj.portafolio_ids) : []); } catch { setObjetivoPortafolioIds([]); }
                            setShowObjetivoForm(true);
                          }}>Editar</button>
                        <button type="button" className="buttonDanger"
                          style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                          onClick={() => handleEliminarObjetivo(obj.id)}>Eliminar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "snapshots" ? (
        <>
          <h1>Snapshots</h1>
          <section>
            <h2>Filtros</h2>
            <form
              className="form snapshotFiltersForm"
              onSubmit={async (event) => {
                event.preventDefault();
                await loadSnapshotsData();
              }}
            >
              <div className="snapshotFilterField">
                <label htmlFor="snapshotPortafolio">Portafolio</label>
                <select
                  id="snapshotPortafolio"
                  value={snapshotPortafolioId}
                  onChange={(e) => setSnapshotPortafolioId(e.target.value)}
                  required
                >
                  <option value="">Selecciona un portafolio</option>
                  {portafolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="snapshotFilterField">
                <label htmlFor="snapshotFechaInicio">Fecha inicio</label>
                <input
                  id="snapshotFechaInicio"
                  type="date"
                  value={snapshotFechaInicio}
                  onChange={(e) => setSnapshotFechaInicio(e.target.value)}
                />
              </div>

              <div className="snapshotFilterField">
                <label htmlFor="snapshotFechaFin">Fecha fin</label>
                <input
                  id="snapshotFechaFin"
                  type="date"
                  value={snapshotFechaFin}
                  onChange={(e) => setSnapshotFechaFin(e.target.value)}
                />
              </div>

              <div className="actionsRow snapshotFilterActions">
                <button type="submit" disabled={loadingSnapshots || !snapshotPortafolioId}>
                  {loadingSnapshots ? "Consultando..." : "Consultar snapshots"}
                </button>
                <button
                  type="button"
                  disabled={loadingSnapshots || !snapshotPortafolioId}
                  onClick={handleGenerarSnapshotManual}
                >
                  Hacer snapshot ahora
                </button>
                <button
                  type="button"
                  disabled={loadingSnapshots || portafolios.length === 0}
                  onClick={handleGenerarSnapshotsTodos}
                >
                  Snapshot todos los portafolios
                </button>
                <button
                  type="button"
                  className="buttonSecondary"
                  onClick={() => {
                    setSnapshotFechaInicio("");
                    setSnapshotFechaFin("");
                  }}
                >
                  Quitar filtro de fechas
                </button>
              </div>
            </form>
          </section>

          {portfolioSnapshots.length > 0 ? (
            <section>
              <div className="summaryGrid">
                <article className="summaryCard">
                  <h2>{portfolioSnapshots.length}</h2>
                  <p>Snapshots de portafolio</p>
                </article>
                <article className="summaryCard">
                  <h2>{Number(firstPortfolioSnapshot?.valor || 0).toFixed(2)}</h2>
                  <p>Valor inicial</p>
                </article>
                <article className="summaryCard">
                  <h2>{Number(lastPortfolioSnapshot?.valor || 0).toFixed(2)}</h2>
                  <p>Valor final</p>
                </article>
                <article className="summaryCard">
                  <h2>
                    {portfolioVariacion >= 0 ? "+" : ""}
                    {portfolioVariacion.toFixed(2)} ({portfolioVariacionPct.toFixed(2)}%)
                  </h2>
                  <p>Variacion</p>
                </article>
              </div>
            </section>
          ) : null}

          <section>
            <h2>Snapshots de portafolio</h2>
            {loadingSnapshots ? <p>Cargando snapshots...</p> : null}
            <div className="snapshotTableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Portafolio</th>
                    <th>Valor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPortfolioSnapshots.length === 0 ? (
                    <tr>
                      <td colSpan="4">No hay snapshots de portafolio para este filtro</td>
                    </tr>
                  ) : (
                    pagedSnapshots.map((snapshot, index) => {
                      const dateLabel = formatSnapshotDate(snapshot.fecha);
                      const dateKey = snapshotDateKey(snapshot.fecha);
                      const snapshotKey = snapshotDateTimeKey(snapshot.fecha);
                      const posicionesDelSnapshot = posicionSnapshotsByDateTime[snapshotKey] || [];
                      const isExpanded = expandedPortfolioSnapshotId === snapshot.id;
                      const showDateSeparator =
                        index === 0 ||
                        snapshotDateKey(pagedSnapshots[index - 1]?.fecha) !== dateKey;
                      return (
                        <Fragment key={snapshot.id}>
                          {showDateSeparator ? (
                            <tr className="snapshotDateSeparatorRow">
                              <td colSpan="4">Fecha: {dateLabel}</td>
                            </tr>
                          ) : null}
                          <tr
                            className="tableRowClickable snapshotParentRow"
                            onClick={() =>
                              setExpandedPortfolioSnapshotId((current) =>
                                current === snapshot.id ? null : snapshot.id
                              )
                            }
                          >
                            <td>{formatSnapshotTime(snapshot.fecha)}</td>
                            <td>{snapshot.portafolio_nombre || "-"}</td>
                            <td>{Number(snapshot.valor || 0).toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                className="buttonDanger iconActionButton"
                                disabled={loadingSnapshots}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEliminarSnapshotPortafolio(snapshot);
                                }}
                                title="Eliminar"
                                aria-label="Eliminar"
                              >
                                <img
                                  src="/buttons/delete.svg"
                                  alt=""
                                  aria-hidden="true"
                                  className="iconActionImage"
                                />
                              </button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="snapshotExpandedRow">
                              <td colSpan="4" className="snapshotExpandedCell">
                                <div className="snapshotExpandedInner">
                                  <p className="snapshotHint">
                                    Snapshots de posiciones para {dateLabel}: {posicionesDelSnapshot.length}
                                  </p>
                                  {posicionesDelSnapshot.length === 0 ? (
                                    <p className="snapshotHint">
                                      No hay snapshots de posiciones para esta snapshot.
                                    </p>
                                  ) : (
                                    <table className="table snapshotNestedTable">
                                      <thead>
                                        <tr>
                                          <th>Activo</th>
                                          <th>Ticker</th>
                                          <th>Cantidad</th>
                                          <th>Valor</th>
                                          <th>Portafolio</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {posicionesDelSnapshot.map((pos) => (
                                          <tr key={pos.id}>
                                            <td>{pos.activo_nombre || "-"}</td>
                                            <td>{pos.ticker || "-"}</td>
                                            <td>{Number(pos.cantidad || 0).toFixed(4)}</td>
                                            <td>{Number(pos.valor || 0).toFixed(2)}</td>
                                            <td>{pos.portafolio_nombre || "-"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(currentSnapshotsPage, totalSnapshotsPages, setSnapshotsPage)}
          </section>
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}
    </>
  ) : (
    <div className="loginWrap">
      <h1>Acceso</h1>
      <div className="tabs">
        <button
          type="button"
          className={tab === "login" ? "tab active" : "tab"}
          onClick={() => setTab("login")}
        >
          Iniciar sesion
        </button>
        <button
          type="button"
          className={tab === "register" ? "tab active" : "tab"}
          onClick={() => setTab("register")}
        >
          Crear usuario
        </button>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Procesando..." : tab === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      {error ? <pre className="error">{error}</pre> : null}
    </div>
  );

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="headerInner">
          <div>
            <h1 className="brand">Invests</h1>
            <p className="tagline">Gestion de portafolios e inversiones</p>
          </div>
          {usuario ? (
            <div className="headerActions">
              {[
                { key: "inicio",     label: "Inicio" },
                { key: "cashflow",   label: "CashFlow" },
                { key: "portafolio", label: "Portafolio" },
                { key: "watchlist",  label: "Watchlist" },
                { key: "snapshots",  label: "Snapshots" },
                { key: "objetivos",  label: "Objetivos" },
                { key: "noticias",   label: "Noticias" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={
                    currentPage === key
                      ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                      : "buttonSecondary headerButton headerNavButton"
                  }
                  onClick={() => setCurrentPage(key)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={
                  currentPage === "settings"
                    ? "buttonSecondary headerButton headerButtonActive headerIconButton"
                    : "buttonSecondary headerButton headerIconButton"
                }
                onClick={() => setCurrentPage("settings")}
                title="Perfil"
                aria-label="Perfil"
              >
                <img src="/buttons/user.svg" alt="" aria-hidden="true" className="headerIconImage" />
                {unreadNotificaciones > 0 ? (
                  <span className="headerIconBadge">{unreadNotificaciones}</span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className={`appBody${usuario && (currentPage === "portafolio" || SIDEBAR_ITEMS[currentPage]?.length > 1) ? " hasSidebar" : ""}`}>
        {usuario && currentPage === "portafolio" ? (
          <nav className="globalSidebar" aria-label="Portafolios">
            <div className="globalSidebarTitle">Portafolios</div>
            <button
              type="button"
              className="sidebarPortafolioNew"
              onClick={() => { clearPortafolioForm(); setEditingId(null); setShowPortafolioForm(true); }}
            >
              + Nuevo
            </button>
            <div className="globalSidebarDivider" />
            {orderedPortafolios.map((p) => (
              <div
                key={p.id}
                className={`sidebarPortafolioItem${selectedPortafolio?.id === p.id ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="sidebarPortafolioItemBtn"
                  onClick={() => loadPosiciones(p)}
                  title={p.nombre}
                >
                  {p.nombre}
                </button>
                <div className="sidebarPortafolioItemActions">
                  <button
                    type="button"
                    className="sidebarPortafolioIconBtn"
                    onClick={() => startEdit(p)}
                    title="Editar"
                  >
                    <img src="/buttons/edit.svg" alt="Editar" />
                  </button>
                  <button
                    type="button"
                    className="sidebarPortafolioIconBtn"
                    onClick={() => handleDelete(p.id)}
                    title="Eliminar"
                  >
                    <img src="/buttons/delete.svg" alt="Eliminar" />
                  </button>
                </div>
              </div>
            ))}
          </nav>
        ) : usuario && SIDEBAR_ITEMS[currentPage]?.length > 1 ? (() => {
          const subPageMap = {
            inicio:    [inicioSubPage,    setInicioSubPage],
            cashflow:  [cashflowSubPage,  setCashflowSubPage],
            watchlist: [watchlistSubPage, setWatchlistSubPage],
          };
          const [activeSub, setActiveSub] = subPageMap[currentPage] || [null, () => {}];
          const items = SIDEBAR_ITEMS[currentPage];
          return (
            <nav className="globalSidebar" aria-label="Navegación de sección">
              <div className="globalSidebarTitle">
                {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
              </div>
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`globalSidebarItem${activeSub === item.key ? " active" : ""}`}
                  onClick={() => {
                    setActiveSub(item.key);
                    document.getElementById(`sec-${currentPage}-${item.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          );
        })() : null}
        <main className="container">
        {toastNotifications.length ? (
          <div className="toastStack" role="status" aria-live="polite">
            {toastNotifications.map((toast) => (
              <div
                key={toast.id}
                className={`toastPopup ${
                  toast.tone === "info" ? "toastPopupInfo" : "toastPopupSuccess"
                }`}
              >
                {toast.text}
              </div>
            ))}
          </div>
        ) : null}
        {usuario && unreadNotificaciones > 0 ? (
          <div className="actionsRow">
            <p className="inlineNotice">
              Tienes {unreadNotificaciones} notificacion{unreadNotificaciones === 1 ? "" : "es"} sin
              leer.
            </p>
            <button type="button" className="buttonSecondary" onClick={() => setCurrentPage("settings")}>
              Ver en ajustes
            </button>
          </div>
        ) : null}
        {usuario && currentPage === "settings" ? (
          <>
            <div className="listHeader">
              <h1>Ajustes de usuario</h1>
              <button type="button" className="buttonDanger" onClick={logout}>
                Cerrar sesion
              </button>
            </div>
            <p>
              <strong>Nombre:</strong> {usuario.nombre}
            </p>

            <section>
              <h2>Apariencia</h2>
              <div className="actionsRow" style={{ alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "0.88rem" }}>Modo oscuro</span>
                <button
                  type="button"
                  className={`buttonSecondary${darkMode ? " headerButtonActive" : ""}`}
                  style={{ minWidth: 80 }}
                  onClick={() => setDarkMode((prev) => !prev)}
                >
                  {darkMode ? "☀ Claro" : "☾ Oscuro"}
                </button>
              </div>
            </section>

            <div className="settingsInlineRow">
              <div className="settingsInlineField">
                <label htmlFor="userMoneda">Moneda del usuario</label>
                <select
                  id="userMoneda"
                  value={settingsMonedaId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setSettingsMonedaId(value);
                    await handleSaveMonedaUsuario(value);
                  }}
                  disabled={loading}
                >
                  <option value="">Selecciona moneda</option>
                  {monedas.map((moneda) => (
                    <option key={moneda.id} value={moneda.id}>
                      {moneda.nombre} {moneda.ticker ? `(${moneda.ticker})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <section>
              <h2>Snapshots automaticos</h2>
              <label htmlFor="snapshotEnabled">Habilitar snapshots en segundo plano</label>
              <select
                id="snapshotEnabled"
                value={snapshotConfigEnabled ? "1" : "0"}
                onChange={async (e) => {
                  const enabled = e.target.value === "1";
                  setSnapshotConfigEnabled(enabled);
                  await handleSaveSnapshotConfig({
                    enabled,
                    interval: snapshotIntervalPortafolio
                  });
                }}
                disabled={loading}
              >
                <option value="1">Si</option>
                <option value="0">No</option>
              </select>
              <label htmlFor="snapshotIntervalUnified">
                Intervalo snapshots (portafolios y posiciones)
              </label>
              <select
                id="snapshotIntervalUnified"
                value={snapshotIntervalPortafolio}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSnapshotIntervalPortafolio(value);
                  setSnapshotIntervalPosicion(value);
                  await handleSaveSnapshotConfig({
                    enabled: snapshotConfigEnabled,
                    interval: value
                  });
                }}
                disabled={loading}
              >
                {SNAPSHOT_INTERVAL_OPTIONS.map((option, index) => (
                  <option key={`${option.value}-${option.label}-${index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <div className="listHeader">
                <h2>Notificaciones</h2>
              </div>
              <div className="actionsRow">
                <button
                  type="button"
                  className="buttonSecondary"
                  onClick={handleMarkAllNotificacionesRead}
                  disabled={loading || unreadNotificaciones === 0}
                >
                  Marcar todas como leidas
                </button>
                <button
                  type="button"
                  className="buttonSecondary"
                  onClick={handleDismissAllNotificaciones}
                  disabled={loading || sortedNotificaciones.length === 0}
                >
                  Descartar todas
                </button>
              </div>
              {loadingNotificaciones ? <p>Cargando notificaciones...</p> : null}
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNotificaciones.length === 0 ? (
                    <tr>
                      <td colSpan="5">No hay notificaciones</td>
                    </tr>
                  ) : (
                    pagedNotificaciones.map((n, index) => {
                      const dateKey = n.created_at ? String(n.created_at).slice(0, 10) : "";
                      const prevDateKey =
                        index > 0 && pagedNotificaciones[index - 1]?.created_at
                          ? String(pagedNotificaciones[index - 1].created_at).slice(0, 10)
                          : "";
                      const showDateSeparator = index === 0 || dateKey !== prevDateKey;
                      return (
                        <Fragment key={n.id}>
                          {showDateSeparator ? (
                            <tr className="snapshotDateSeparatorRow">
                              <td colSpan="5">Fecha: {dateKey ? formatSnapshotDate(dateKey) : "-"}</td>
                            </tr>
                          ) : null}
                          <tr>
                            <td>{n.created_at ? String(n.created_at).slice(0, 19).replace("T", " ") : "-"}</td>
                            <td>{n.tipo || "-"}</td>
                            <td>{n.mensaje}</td>
                            <td>{Number(n.leida) === 1 ? "Leida" : "No leida"}</td>
                            <td className="actionsCell">
                              {Number(n.leida) === 1 ? (
                                <span>-</span>
                              ) : (
                                <button type="button" onClick={() => handleMarkNotificacionRead(n.id)}>
                                  Marcar leida
                                </button>
                              )}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
              {renderPagination(
                currentNotificacionesPage,
                totalNotificacionesPages,
                setNotificacionesPage
              )}
            </section>
            {error ? <pre className="error">{error}</pre> : null}
          </>
        ) : (
          mainContent
        )}
      </main>
      </div>

      <footer className="appFooter">
        <div className="footerInner">
          <div className="footerBrand">
            <span className="footerBrandName">Invests</span>
            <span className="footerBrandTagline">Gestión de portafolios e inversiones personales</span>
          </div>
          <div className="footerCenter">
            <p className="footerDisclaimer">
              Los datos mostrados son meramente informativos y no constituyen asesoramiento financiero.{" "}
              Precios y rentabilidades pasadas no garantizan resultados futuros.
            </p>
          </div>
          <div className="footerRight">
            <span className="footerDataSources">
              Precios vía{" "}
              <a href="https://finance.yahoo.com" target="_blank" rel="noreferrer">Yahoo Finance</a>
              {" · "}
              Benchmarks:{" "}
              <a href="https://finance.yahoo.com/markets/world-indices/" target="_blank" rel="noreferrer">Índices mundiales</a>
            </span>
            <span className="footerCopy">© {new Date().getFullYear()} Invests</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
