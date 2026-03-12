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
  eliminarActivo,
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
  updateSnapshotConfigByUsuario
} from "./lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function App() {
  const LIST_PAGE_SIZE = 10;
  const SNAPSHOT_INTERVAL_OPTIONS = [
    { value: "60", label: "Cada hora" },
    { value: "480", label: "Cada 8 horas" },
    { value: "1440", label: "Cada 24 horas" },
    { value: "1440", label: "Cada dia" },
    { value: "10080", label: "Cada semana" },
    { value: "43200", label: "Cada mes" },
    { value: "129600", label: "Cada 3 meses" },
    { value: "259200", label: "Cada 6 meses" },
    { value: "525600", label: "Cada ano" }
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
  const [activoYahooTicker, setActivoYahooTicker] = useState("");
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
  const [selectedActivoId, setSelectedActivoId] = useState("");
  const [detalleAccionActivo, setDetalleAccionActivo] = useState(null);
  const [detalleFondoActivo, setDetalleFondoActivo] = useState(null);
  const [loadingDetalleActivo, setLoadingDetalleActivo] = useState(false);
  const [expandedPosicionId, setExpandedPosicionId] = useState(null);
  const [detalleAccionPosicion, setDetalleAccionPosicion] = useState(null);
  const [detalleFondoPosicion, setDetalleFondoPosicion] = useState(null);
  const [loadingDetallePosicion, setLoadingDetallePosicion] = useState(false);
  const [portafoliosPage, setPortafoliosPage] = useState(1);
  const [ordenesPage, setOrdenesPage] = useState(1);
  const [activosPage, setActivosPage] = useState(1);
  const [movimientosPage, setMovimientosPage] = useState(1);
  const [snapshotsPage, setSnapshotsPage] = useState(1);
  const [notificacionesPage, setNotificacionesPage] = useState(1);
  const [posicionesSort, setPosicionesSort] = useState({
    key: "precio_actual",
    direction: "desc"
  });
  const [activosSort, setActivosSort] = useState({
    key: "nombre",
    direction: "asc"
  });
  const [loadingInicioCharts, setLoadingInicioCharts] = useState(false);
  const [inicioPortfolioSeries, setInicioPortfolioSeries] = useState([]);
  const [inicioPortfolioKeys, setInicioPortfolioKeys] = useState([]);
  const [inicioRentabilidadSeries, setInicioRentabilidadSeries] = useState([]);
  const [hiddenInicioPortfolioKeys, setHiddenInicioPortfolioKeys] = useState({});
  const [loadingPosicionCharts, setLoadingPosicionCharts] = useState(false);
  const [posicionesEvolutionSeries, setPosicionesEvolutionSeries] = useState([]);
  const [posicionesEvolutionKeys, setPosicionesEvolutionKeys] = useState([]);
  const [selectedPosicionChartKey, setSelectedPosicionChartKey] = useState("");
  const [visiblePosicionChartKeys, setVisiblePosicionChartKeys] = useState([]);
  const [posicionesRentabilidadSeries, setPosicionesRentabilidadSeries] = useState([]);
  const [loadingNoticias, setLoadingNoticias] = useState(false);
  const [noticiasRecientes, setNoticiasRecientes] = useState([]);
  const [noticiasFetchedAt, setNoticiasFetchedAt] = useState("");

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
      setSelectedActivoId("");
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
    setSelectedActivoId("");
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

  useEffect(() => {
    if (!selectedActivoId) return;
    const exists = activos.some((activo) => String(activo.id) === String(selectedActivoId));
    if (!exists) {
      setSelectedActivoId("");
    }
  }, [activos, selectedActivoId]);

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

  async function handleDeleteActivoSeleccionado() {
    if (!selectedActivo) return;
    const confirmed = window.confirm(
      "Se eliminara el activo seleccionado. Deseas continuar?"
    );
    if (!confirmed) return;

    setLoadingData(true);
    setError("");
    setMessage("");
    try {
      await eliminarActivo(selectedActivo.id);
      setMessage("Activo eliminado");
      setSelectedActivoId("");
      await loadActivosData({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
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
    if (!usuario?.moneda_id) return;
    if (!cashFlowMonedaId) {
      setCashFlowMonedaId(String(usuario.moneda_id));
    }
  }, [usuario?.moneda_id, cashFlowMonedaId]);

  useEffect(() => {
    if (!usuario || currentPage !== "activos") return;
    loadActivosData();
  }, [usuario, currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "activos") return;
    const intervalId = setInterval(() => {
      loadActivosData({ silent: true });
    }, 60000);
    return () => clearInterval(intervalId);
  }, [usuario, currentPage]);

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
    if (!usuario || currentPage !== "activos" || !selectedActivoId) {
      setDetalleAccionActivo(null);
      setDetalleFondoActivo(null);
      setLoadingDetalleActivo(false);
      return;
    }

    const activoSeleccionado = activos.find(
      (activo) => String(activo.id) === String(selectedActivoId)
    );
    if (!activoSeleccionado) {
      setDetalleAccionActivo(null);
      setDetalleFondoActivo(null);
      setLoadingDetalleActivo(false);
      return;
    }

    const categoriaId = Number(activoSeleccionado.categoria_id || 0);
    if (categoriaId !== 2 && categoriaId !== 3) {
      setDetalleAccionActivo(null);
      setDetalleFondoActivo(null);
      setLoadingDetalleActivo(false);
      return;
    }

    let cancelled = false;
    setLoadingDetalleActivo(true);
    (async () => {
      try {
        if (categoriaId === 2) {
          const list = await getDetallesAccionByActivo(activoSeleccionado.id);
          if (!cancelled) {
            setDetalleAccionActivo(Array.isArray(list) && list.length ? list[0] : null);
            setDetalleFondoActivo(null);
          }
          return;
        }
        const list = await getDetallesFondoByActivo(activoSeleccionado.id);
        if (!cancelled) {
          setDetalleFondoActivo(Array.isArray(list) && list.length ? list[0] : null);
          setDetalleAccionActivo(null);
        }
      } catch {
        if (!cancelled) {
          setDetalleAccionActivo(null);
          setDetalleFondoActivo(null);
        }
      } finally {
        if (!cancelled) setLoadingDetalleActivo(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [usuario, currentPage, selectedActivoId, activos]);

  useEffect(() => {
    if (!usuario || currentPage !== "inicio" || !expandedPosicionId) {
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
    setActivosPage(1);
    setMovimientosPage(1);
    setSnapshotsPage(1);
    setNotificacionesPage(1);
  }, [currentPage]);

  useEffect(() => {
    if (!usuario || currentPage !== "inicio") {
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
  }, [usuario, currentPage, portafolios]);

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

  async function handleImportActivoDesdeYahooEnActivos() {
    setLoadingActivoYahoo(true);
    setError("");
    setMessage("");
    try {
      const activoId = await importActivoPorTicker(activoYahooTicker, {
        silent: true,
        setOrderFields: false
      });
      await loadActivosData({ silent: true });
      setSelectedActivoId(String(activoId));
      setActivoYahooTicker("");
      setMessage("Activo importado desde Yahoo Finance");
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
  const sortedActivos = activos.slice().sort((a, b) => {
    const direction = activosSort.direction === "asc" ? 1 : -1;
    if (activosSort.key === "precio") {
      return (Number(a.precio || 0) - Number(b.precio || 0)) * direction;
    }
    const valueA = String(a?.[activosSort.key] || "");
    const valueB = String(b?.[activosSort.key] || "");
    return valueA.localeCompare(valueB, "es", { sensitivity: "base" }) * direction;
  });
  const sortedPosiciones = posiciones.slice().sort((a, b) => {
    const direction = posicionesSort.direction === "asc" ? 1 : -1;
    if (posicionesSort.key === "variacion_diaria") {
      return (Number(a.variacion_diaria || 0) - Number(b.variacion_diaria || 0)) * direction;
    }
    if (posicionesSort.key === "precio_actual") {
      return (Number(a.precio_actual || 0) - Number(b.precio_actual || 0)) * direction;
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
  const selectedActivo =
    activos.find((activo) => String(activo.id) === String(selectedActivoId)) || null;
  const selectedAssetIconSrc = selectedActivo
    ? resolveAssetIconSrc(selectedActivo, detalleFondoActivo)
    : null;
  const visiblePosiciones = showZeroPosiciones
    ? sortedPosiciones
    : sortedPosiciones.filter((posicion) => Number(posicion.cantidad || 0) > 0);
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
  const totalActivosPages = Math.max(1, Math.ceil(sortedActivos.length / LIST_PAGE_SIZE));
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
  const currentActivosPage = Math.min(activosPage, totalActivosPages);
  const currentMovimientosPage = Math.min(movimientosPage, totalMovimientosPages);
  const currentSnapshotsPage = Math.min(snapshotsPage, totalSnapshotsPages);
  const currentNotificacionesPage = Math.min(notificacionesPage, totalNotificacionesPages);
  const pagedPortafolios = portafolios.slice(
    (currentPortafoliosPage - 1) * LIST_PAGE_SIZE,
    currentPortafoliosPage * LIST_PAGE_SIZE
  );
  const pagedActivos = sortedActivos.slice(
    (currentActivosPage - 1) * LIST_PAGE_SIZE,
    currentActivosPage * LIST_PAGE_SIZE
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

  const mainContent = usuario ? (
    <>
      {currentPage === "inicio" ? (
        <>
          <h1>Inicio</h1>
          <p>
            Sesion activa como <strong>{usuario.nombre}</strong>
          </p>

          <section>
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
                    {resumenesConMetricas.map((resumen) => (
                      <tr key={resumen.id}>
                        <td>{resumen.categoria_nombre || "-"}</td>
                        <td>{Number(resumen.totalCategoriaMoneda || 0).toFixed(2)}</td>
                        <td>{Number(resumen.inversionInicial || 0).toFixed(2)}</td>
                        <td title={resumen.tooltipRentabilidad}>
                          {Number(resumen.rentabilidad || 0).toFixed(2)}%
                        </td>
                        <td title={resumen.tooltipPeso}>{Number(resumen.peso || 0).toFixed(2)}%</td>
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

          <section>
            <div className="listHeader">
              <h2>Graficos</h2>
            </div>
            <div className="dashboardChartsGrid">
              <article className="chartCard chartCardWide">
                <h3>Peso de la tabla resumen</h3>
                {resumenPieData.length === 0 ? (
                  <p className="chartNoData">No hay datos para mostrar.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={resumenPieData} dataKey="valor" nameKey="categoria" outerRadius={112}>
                          {resumenPieData.map((entry, index) => (
                            <Cell
                              key={`resumen-pie-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value || 0).toFixed(2)} ${monedaResumenTicker}`,
                            "Valor"
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard chartCardWide">
                <h3>Evolución del valor total por portafolios</h3>
                {loadingInicioCharts ? (
                  <p className="chartNoData">Cargando series de snapshots...</p>
                ) : inicioPortfolioSeries.length === 0 ? (
                  <p className="chartNoData">No hay snapshots para construir la evolucion.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={300}>
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
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="chartCard chartCardWide">
                <h3>Evolución de la rentabilidad</h3>
                {loadingInicioCharts ? (
                  <p className="chartNoData">Cargando rentabilidad...</p>
                ) : inicioRentabilidadSeries.length === 0 ? (
                  <p className="chartNoData">No hay datos suficientes para calcular rentabilidad.</p>
                ) : (
                  <div className="chartWrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={inicioRentabilidadSeries}>
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
                          name="Rentabilidad total"
                          stroke="#16a34a"
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

          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}

      {currentPage === "portafolio" ? (
        <>
          <h1>Portafolios</h1>
          <section>
            <div className="actionsRow">
              <button
                type="button"
                className={`buttonSecondary iconToggleButton${
                  showPortafolioForm ? " iconToggleButtonOpen" : ""
                }`}
                onClick={() => setShowPortafolioForm((prev) => !prev)}
                title={showPortafolioForm ? "Ocultar formulario" : "Mostrar formulario"}
                aria-label={showPortafolioForm ? "Ocultar formulario" : "Mostrar formulario"}
              >
                <img src="/buttons/add.svg" alt="" aria-hidden="true" className="iconToggleImage" />
              </button>
            </div>
            {showPortafolioForm ? (
              <>
                <h2>{editingId ? "Editar portafolio" : "Crear portafolio"}</h2>
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
                    <label htmlFor="pfMoneda">DIVISA</label>
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
                    <label htmlFor="pfCategoria">Categoria</label>
                    <select
                      id="pfCategoria"
                      value={pfCategoriaId}
                      onChange={(e) => setPfCategoriaId(e.target.value)}
                    >
                      <option value="">Sin categoria</option>
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
                    {editingId ? (
                      <button
                        type="button"
                        className="buttonSecondary"
                        onClick={() => {
                          setEditingId(null);
                          clearPortafolioForm();
                          setShowPortafolioForm(false);
                        }}
                      >
                        Cancelar edicion
                      </button>
                    ) : null}
                  </div>
                </form>
              </>
            ) : null}
          </section>

          <section>
            <div className="listHeader">
              <h2>Tus portafolios</h2>
            </div>
            {loadingData ? <p>Cargando...</p> : null}
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Moneda</th>
                  <th>Categoria</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {portafolios.length === 0 ? (
                  <tr>
                    <td colSpan="4">No hay portafolios todavia</td>
                  </tr>
                ) : (
                  pagedPortafolios.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.moneda_nombre || "-"}</td>
                      <td>{p.categoria || "-"}</td>
                      <td className="actionsCell">
                        <button
                          type="button"
                          className="buttonSecondary iconActionButton"
                          onClick={() => loadPosiciones(p)}
                          title="Ver posiciones"
                          aria-label="Ver posiciones"
                        >
                          <img
                            src="/buttons/view.svg"
                            alt=""
                            aria-hidden="true"
                            className="iconActionImage"
                          />
                        </button>
                        <button
                          type="button"
                          className="buttonSecondary iconActionButton"
                          onClick={() => startEdit(p)}
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
                          onClick={() => handleDelete(p.id)}
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
                  ))
                )}
              </tbody>
            </table>
            {renderPagination(currentPortafoliosPage, totalPortafoliosPages, setPortafoliosPage)}
          </section>

          <section>
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
                  <h2>{resumenPosiciones.total_posiciones || 0}</h2>
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
                          Variacion diaria{" "}
                          <span>{getSortIndicator(posicionesSort, "variacion_diaria")}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePosiciones.length === 0 ? (
                      <tr>
                        <td colSpan="4">No hay posiciones para el filtro actual</td>
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
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td colSpan="4">
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
                                      <p>
                                        <strong>Rentabilidad:</strong>{" "}
                                        {Number(expandedPosicion?.rentabilidad || 0).toFixed(2)}%
                                      </p>
                                      <p>
                                        <strong>Valor total:</strong>{" "}
                                        {Number(
                                          expandedPosicion?.valor_total ||
                                            expandedPosicion?.valor_actual ||
                                            0
                                        ).toFixed(2)}
                                        {expandedPosicion?.precio_actual_moneda_ticker
                                          ? ` ${expandedPosicion.precio_actual_moneda_ticker}`
                                          : ""}
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
                                          <strong>Icono:</strong>{" "}
                                          {expandedPosicionIconSrc ||
                                            expandedPosicionActivo?.icono ||
                                            expandedPosicion?.activo_icono ||
                                            "-"}
                                        </p>
                                        <p>
                                          <strong>Vista icono:</strong>{" "}
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
                                          {formatLargeNumberOrDashZero(expandedPosicionActivo?.capitalizacion)}
                                        </p>
                                        <p>
                                          <strong>Volumen:</strong>{" "}
                                          {formatLargeNumberOrDashZero(expandedPosicionActivo?.volumen)}
                                        </p>
                                        <p>
                                          <strong>Variacion:</strong>{" "}
                                          {formatPercentOrDashZero(
                                            expandedPosicionActivo?.variacion_porcentual ??
                                              expandedPosicion?.variacion_diaria
                                          )}
                                        </p>
                                        <p>
                                          <strong>Moneda:</strong> {expandedPosicionActivo?.moneda || "-"}
                                        </p>
                                        <p>
                                          <strong>Mercado:</strong> {expandedPosicionActivo?.mercado || "-"}
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

                <div className="actionsRow">
                  <button
                    type="button"
                    className="buttonSecondary"
                    onClick={() => setShowZeroPosiciones((prev) => !prev)}
                  >
                    {showZeroPosiciones
                      ? "Ocultar posiciones con cantidad 0"
                      : "Mostrar posiciones con cantidad 0"}
                  </button>
                </div>

                <section>
                  <h3>Graficos de posiciones</h3>
                  <div className="dashboardChartsGrid">
                    <article className="chartCard chartCardWide">
                      <h3>Evolucion total por posiciones</h3>
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
                        <p className="chartNoData">Solo se muestra la linea Total. Anade posiciones para compararlas.</p>
                      )}
                      {loadingPosicionCharts ? (
                        <p className="chartNoData">Cargando snapshots de posiciones...</p>
                      ) : posicionesEvolutionSeries.length === 0 ? (
                        <p className="chartNoData">No hay snapshots para construir esta evolucion.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={320}>
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
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>

                    <article className="chartCard chartCardWide">
                      <h3>Peso de las posiciones</h3>
                      {posicionesPesoData.length === 0 ? (
                        <p className="chartNoData">No hay posiciones con valor para mostrar.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                              <Pie data={posicionesPesoData} dataKey="valor" nameKey="nombre" outerRadius={112}>
                                {posicionesPesoData.map((entry, index) => (
                                  <Cell
                                    key={`pos-pie-${entry.nombre}-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [Number(value || 0).toFixed(2), "Valor"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </article>

                    <article className="chartCard chartCardWide">
                      <h3>Evolucion de la rentabilidad del portafolio</h3>
                      {loadingPosicionCharts ? (
                        <p className="chartNoData">Cargando rentabilidad...</p>
                      ) : posicionesRentabilidadSeries.length === 0 ? (
                        <p className="chartNoData">No hay datos suficientes para calcular rentabilidad.</p>
                      ) : (
                        <div className="chartWrap">
                          <ResponsiveContainer width="100%" height={260}>
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
          {error ? <pre className="error">{error}</pre> : null}
        </>
      ) : null}
      {currentPage === "activos" ? (
        <>
          <h1>Lista de seguimiento</h1>
          <section>
            <div className="listHeader">
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Ticker Yahoo (ej. AAPL)"
                  value={activoYahooTicker}
                  onChange={(e) => setActivoYahooTicker(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  onClick={handleImportActivoDesdeYahooEnActivos}
                  disabled={loadingActivoYahoo || !activoYahooTicker.trim()}
                >
                  {loadingActivoYahoo ? "Importando..." : "Buscar e importar"}
                </button>
                <button type="button" className="buttonSecondary" onClick={loadActivosData}>
                  Refrescar
                </button>
              </div>
            </div>
            {loadingData ? <p>Cargando activos...</p> : null}
            <table className="table">
              <thead>
                <tr>
                  <th>Icono</th>
                  <th>
                    <button
                      type="button"
                      className="tableSortButton"
                      onClick={() => setActivosSort((prev) => getNextSortState(prev, "nombre", "asc"))}
                    >
                      Nombre <span>{getSortIndicator(activosSort, "nombre")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="tableSortButton"
                      onClick={() => setActivosSort((prev) => getNextSortState(prev, "ticker", "asc"))}
                    >
                      Ticker <span>{getSortIndicator(activosSort, "ticker")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="tableSortButton"
                      onClick={() => setActivosSort((prev) => getNextSortState(prev, "categoria", "asc"))}
                    >
                      Categoria <span>{getSortIndicator(activosSort, "categoria")}</span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className="tableSortButton"
                      onClick={() => setActivosSort((prev) => getNextSortState(prev, "precio", "desc"))}
                    >
                      Precio <span>{getSortIndicator(activosSort, "precio")}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedActivos.length === 0 ? (
                  <tr>
                    <td colSpan="5">No hay activos registrados</td>
                  </tr>
                ) : (
                  pagedActivos.map((activo) => {
                      const isSelected = String(selectedActivoId) === String(activo.id);
                      return (
                        <Fragment key={activo.id}>
                          <tr
                            className={isSelected ? "tableRowSelected" : "tableRowClickable"}
                            onClick={() =>
                              setSelectedActivoId((prev) =>
                                String(prev) === String(activo.id) ? "" : String(activo.id)
                              )
                            }
                          >
                            <td>
                              {resolveAssetIconSrc(activo) ? (
                                <img
                                  src={resolveAssetIconSrc(activo)}
                                  alt={activo.ticker || activo.nombre || "Icono activo"}
                                  style={{ width: "24px", height: "24px", objectFit: "contain" }}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>{activo.nombre || "-"}</td>
                            <td>{activo.ticker || "-"}</td>
                            <td>{activo.categoria || "-"}</td>
                            <td>{formatPriceOrDashZero(activo.precio)}</td>
                          </tr>
                          {isSelected ? (
                            <tr>
                              <td colSpan="5">
                                <article className="assetCard">
                                  <h3>{selectedActivo?.nombre || activo.nombre || "-"}</h3>
                                  <div className="assetCardGrid">
                                    <p>
                                      <strong>Ticker:</strong> {selectedActivo?.ticker || activo.ticker || "-"}
                                    </p>
                                    <p>
                                      <strong>Categoria:</strong> {selectedActivo?.categoria || activo.categoria || "-"}
                                    </p>
                                    <p>
                                      <strong>Icono:</strong> {selectedAssetIconSrc || selectedActivo?.icono || activo.icono || "-"}
                                    </p>
                                    <p>
                                      <strong>Vista icono:</strong>{" "}
                                      {selectedAssetIconSrc ? (
                                        <img
                                          src={selectedAssetIconSrc}
                                          alt={selectedActivo?.ticker || selectedActivo?.nombre || "Icono activo"}
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
                                      <strong>Precio:</strong> {formatPriceOrDashZero(selectedActivo?.precio ?? activo.precio)}
                                    </p>
                                    <p>
                                      <strong>Capitalizacion:</strong> {formatLargeNumberOrDashZero(selectedActivo?.capitalizacion ?? activo.capitalizacion)}
                                    </p>
                                    <p>
                                      <strong>Volumen:</strong> {formatLargeNumberOrDashZero(selectedActivo?.volumen ?? activo.volumen)}
                                    </p>
                                    <p>
                                      <strong>Variacion:</strong> {formatPercentOrDashZero(selectedActivo?.variacion_porcentual ?? activo.variacion_porcentual)}
                                    </p>
                                    <p>
                                      <strong>Moneda:</strong> {selectedActivo?.moneda || activo.moneda || "-"}
                                    </p>
                                    <p>
                                      <strong>Mercado:</strong> {selectedActivo?.mercado || activo.mercado || "-"}
                                    </p>
                                  </div>
                                  {Number((selectedActivo?.categoria_id ?? activo.categoria_id) || 0) === 2 ? (
                                    <div style={{ marginTop: "12px" }}>
                                      <h4>DetallesAccion</h4>
                                      {loadingDetalleActivo ? (
                                        <p>Cargando detalles de accion...</p>
                                      ) : detalleAccionActivo ? (
                                        <div className="assetCardGrid">
                                          <p>
                                            <strong>Sector:</strong> {detalleAccionActivo.sector_nombre || "-"}
                                          </p>
                                        </div>
                                      ) : (
                                        <p>No hay DetallesAccion para este activo.</p>
                                      )}
                                    </div>
                                  ) : null}
                                  {Number((selectedActivo?.categoria_id ?? activo.categoria_id) || 0) === 3 ? (
                                    <div style={{ marginTop: "12px" }}>
                                      <h4>DetallesFondo</h4>
                                      {loadingDetalleActivo ? (
                                        <p>Cargando detalles de fondo...</p>
                                      ) : detalleFondoActivo ? (
                                        <div className="assetCardGrid">
                                          <p>
                                            <strong>Gestora:</strong> {detalleFondoActivo.gestora_nombre || "-"}
                                          </p>
                                          <p>
                                            <strong>Politica:</strong> {detalleFondoActivo.politica || "-"}
                                          </p>
                                          <p>
                                            <strong>Tipo:</strong> {detalleFondoActivo.tipo || "-"}
                                          </p>
                                          <p>
                                            <strong>Geografia:</strong> {detalleFondoActivo.geografia || "-"}
                                          </p>
                                        </div>
                                      ) : (
                                        <p>No hay DetallesFondo para este activo.</p>
                                      )}
                                    </div>
                                  ) : null}
                                  <div style={{ marginTop: "12px" }}>
                                    <button
                                      type="button"
                                      className="buttonSecondary"
                                      onClick={handleDeleteActivoSeleccionado}
                                    >
                                      Eliminar activo seleccionado
                                    </button>
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
            {renderPagination(currentActivosPage, totalActivosPages, setActivosPage)}
          </section>
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

          <section>
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
                        >
                          {cashFlowCategoriasIngresosMes.map((entry, index) => (
                            <Cell
                              key={`cf-ingreso-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value || 0).toFixed(2)} ${cashFlowCurrencyTicker}`,
                            "Importe"
                          ]}
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
                        >
                          {cashFlowCategoriasGastosMes.map((entry, index) => (
                            <Cell
                              key={`cf-gasto-${entry.categoria}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value || 0).toFixed(2)} ${cashFlowCurrencyTicker}`,
                            "Importe"
                          ]}
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

          <section className="cashflowCalendarSection">
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

          <section>
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
    <>
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
    </>
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
              <button
                type="button"
                className={
                  currentPage === "inicio"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("inicio")}
              >
                Inicio
              </button>
              <button
                type="button"
                className={
                  currentPage === "portafolio"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("portafolio")}
              >
                Portafolio
              </button>
              <button
                type="button"
                className={
                  currentPage === "cashflow"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("cashflow")}
              >
                Cashflow
              </button>
              <button
                type="button"
                className={
                  currentPage === "snapshots"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("snapshots")}
              >
                Snapshots
              </button>
              <button
                type="button"
                className={
                  currentPage === "activos"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("activos")}
              >
                Lista de seguimiento
              </button>
              <button
                type="button"
                className={
                  currentPage === "noticias"
                    ? "buttonSecondary headerButton headerNavButton headerButtonActive"
                    : "buttonSecondary headerButton headerNavButton"
                }
                onClick={() => setCurrentPage("noticias")}
              >
                Noticias
              </button>
              <button
                type="button"
                className={
                  currentPage === "settings"
                    ? "buttonSecondary headerButton headerButtonActive headerIconButton"
                    : "buttonSecondary headerButton headerIconButton"
                }
                onClick={() => setCurrentPage("settings")}
                title="Ajustes"
                aria-label="Ajustes"
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

      <footer className="appFooter">
        <div className="footerInner">
          <span>Invests</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
