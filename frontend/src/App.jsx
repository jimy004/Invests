import { Fragment, useEffect, useMemo, useState } from "react";
import {
  LIST_PAGE_SIZE, CHART_MAX_POINTS, PIE_MAX_SLICES, PIE_LABEL_MIN_PERCENT,
  VAR_95_ZSCORE, MS_30_DAYS, CHART_COLORS, SNAPSHOT_INTERVAL_OPTIONS, CASHFLOW_CATEGORIAS
} from "./utils/constants.js";
import {
  formatPrice, formatPercent, formatPriceOrDashZero, formatLargeNumberOrDashZero,
  formatPercentOrDashZero, formatCashFlowCategoria, formatSnapshotDate,
  formatSnapshotTime, formatNewsDateTime
} from "./utils/format.js";
import { buildMonthlySeriesLastPoint, buildPosicionesEvolution, buildRentabilidadSeries } from "./utils/chartBuilders.js";
import { isHttpUrl, buildLocalIconFromTicker, resolveGestoraIconSrc, resolveAssetIconSrc, resolvePosicionLogoSrc } from "./utils/assetIcons.js";
import Pagination from "./components/Pagination.jsx";
import NoticiasPage from "./pages/NoticiasPage.jsx";
import ObjetivosPage from "./pages/ObjetivosPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import WatchlistPage from "./pages/WatchlistPage.jsx";
import SnapshotsPage from "./pages/SnapshotsPage.jsx";
import CashflowPage from "./pages/CashflowPage.jsx";
import InicioPage from "./pages/InicioPage.jsx";
import PortafolioPage from "./pages/PortafolioPage.jsx";
import { renderDirectionBadge, renderPiePercentLabel, buildPiePercentTooltipFormatter } from "./utils/chartHelpers.jsx";
import {
  actualizarCashFlow,
  actualizarPortafolio,
  actualizarResumenPeso,
  actualizarUsuario,
  cambiarPassword,
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
  const [snapshotFechaInicio, setSnapshotFechaInicio] = useState(() =>
    new Date(Date.now() - MS_30_DAYS).toISOString().slice(0, 10)
  );
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
  const [pwNuevo, setPwNuevo] = useState("");
  const [pwConfirmar, setPwConfirmar] = useState("");
  const [showPwNuevo, setShowPwNuevo] = useState(false);
  const [showPwConfirmar, setShowPwConfirmar] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
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

  // "?�"? Dark mode �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("darkMode") === "1"; } catch { return false; }
  });

  // "?�"? Precio alertas �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [precioAlertas, setPrecioAlertas] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);
  const [alertaActivoId, setAlertaActivoId] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("mayor");
  const [alertaPrecio, setAlertaPrecio] = useState("");

  // "?�"? Watchlist �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [watchlistActivoTicker, setWatchlistActivoTicker] = useState("");
  const [watchlistNota, setWatchlistNota] = useState("");
  const [showWatchlistForm, setShowWatchlistForm] = useState(false);

  // "?�"? Objetivos financieros �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [objetivos, setObjetivos] = useState([]);
  const [loadingObjetivos, setLoadingObjetivos] = useState(false);
  const [showObjetivoForm, setShowObjetivoForm] = useState(false);
  const [editingObjetivoId, setEditingObjetivoId] = useState(null);
  const [objNombre, setObjNombre] = useState("");
  const [objMontoObjetivo, setObjMontoObjetivo] = useState("");
  const [objFechaObjetivo, setObjFechaObjetivo] = useState("");
  const [objMontoInicial, setObjMontoInicial] = useState("");
  const [objNota, setObjNota] = useState("");

  // "?�"? Dividendos �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [dividendos, setDividendos] = useState([]);
  const [loadingDividendos, setLoadingDividendos] = useState(false);
  const [showDividendoForm, setShowDividendoForm] = useState(false);
  const [divPosicionId, setDivPosicionId] = useState("");
  const [divFecha, setDivFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [divImporte, setDivImporte] = useState("");
  const [divMonedaId, setDivMonedaId] = useState("");
  const [divObservacion, setDivObservacion] = useState("");

  // "?�"? Benchmark �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [benchmarkSymbol, setBenchmarkSymbol] = useState("SP500");
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // "?�"? Simulador de escenarios (por categoría) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?


  // "?�"? Nota por posición �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [editingNotaPosicionId, setEditingNotaPosicionId] = useState(null);
  const [notaPosicionDraft, setNotaPosicionDraft] = useState("");

  // "?�"? Risk metric info tooltip �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [showRiskInfo, setShowRiskInfo] = useState(null);

  // "?�"? Sub-páginas laterales �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [inicioSubPage, setInicioSubPage] = useState("resumen");
  const [cashflowSubPage, setCashflowSubPage] = useState("graficos");
  const [watchlistSubPage, setWatchlistSubPage] = useState("watchlist");

  // "?�"? Objetivos portafolios seleccionados �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const [objetivoPortafolioIds, setObjetivoPortafolioIds] = useState([]);
  const [editObjetivoPortafolioIds, setEditObjetivoPortafolioIds] = useState([]);

  // "?�"? Escenario por categoría �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
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

  function resetUserState() {
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
    setSnapshotFechaInicio(new Date(Date.now() - MS_30_DAYS).toISOString().slice(0, 10));
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
    function handleAuthExpired() {
      setUsuario(null);
      setNombre("");
      setPassword("");
      setMessage("");
      setError("Sesion expirada. Inicia sesion nuevamente.");
      resetUserState();
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
    resetUserState();
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
    Promise.all([
      loadDashboardData(usuario),
      loadSnapshotConfigData(usuario),
      loadNotificacionesData(usuario)
    ]);
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

        const limitedPoints = points.slice(-CHART_MAX_POINTS);
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

  function handleEditarObjetivo(obj) {
    setEditingObjetivoId(obj.id);
    setObjNombre(obj.nombre);
    setObjMontoObjetivo(String(obj.monto_objetivo));
    setObjFechaObjetivo(String(obj.fecha_objetivo).slice(0, 10));
    setObjMontoInicial(String(obj.monto_inicial || 0));
    setObjNota(obj.nota || "");
    try { setObjetivoPortafolioIds(obj.portafolio_ids ? JSON.parse(obj.portafolio_ids) : []); } catch { setObjetivoPortafolioIds([]); }
    setShowObjetivoForm(true);
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

  async function handleCambiarPassword(e) {
    e.preventDefault();
    setPwMessage("");
    if (pwNuevo !== pwConfirmar) {
      setPwMessage("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await cambiarPassword(usuario.id, { password_nuevo: pwNuevo });
      setPwMessage(res?.message || "Contraseña actualizada");
      setPwNuevo("");
      setPwConfirmar("");
    } catch (err) {
      setPwMessage(err.message || "Error al cambiar la contraseña");
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

  const {
    portfolioSnapshotsAsc,
    firstPortfolioSnapshot,
    lastPortfolioSnapshot,
    portfolioVariacion,
    portfolioVariacionPct,
    sortedPortfolioSnapshots
  } = useMemo(() => {
    const asc = [...portfolioSnapshots].sort((a, b) =>
      String(a.fecha || "").localeCompare(String(b.fecha || ""))
    );
    const first = asc[0] || null;
    const last = asc[asc.length - 1] || null;
    const variacion = first && last ? Number(last.valor || 0) - Number(first.valor || 0) : 0;
    const variacionPct =
      first && Number(first.valor || 0) !== 0
        ? (variacion / Number(first.valor || 0)) * 100
        : 0;
    const sorted = portfolioSnapshots.slice().sort((a, b) =>
      String(b.fecha || "").localeCompare(String(a.fecha || ""))
    );
    return {
      portfolioSnapshotsAsc: asc,
      firstPortfolioSnapshot: first,
      lastPortfolioSnapshot: last,
      portfolioVariacion: variacion,
      portfolioVariacionPct: variacionPct,
      sortedPortfolioSnapshots: sorted
    };
  }, [portfolioSnapshots]);
  const sortedPosiciones = useMemo(() => posiciones.slice().sort((a, b) => {
    const direction = posicionesSort.direction === "asc" ? 1 : -1;
    const numericKeys = ["variacion_diaria", "precio_actual", "valor_total", "rentabilidad"];
    if (numericKeys.includes(posicionesSort.key)) {
      return (Number(a[posicionesSort.key] || 0) - Number(b[posicionesSort.key] || 0)) * direction;
    }
    const valueA = String(a?.[posicionesSort.key] || "");
    const valueB = String(b?.[posicionesSort.key] || "");
    return valueA.localeCompare(valueB, "es", { sensitivity: "base" }) * direction;
  }), [posiciones, posicionesSort]);

  const { sortedPosicionSnapshots, posicionSnapshotsByDateTime } = useMemo(() => {
    const snapshotDateTimeKey = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
      const normalized = raw.replace("T", " ").replace("Z", "").slice(0, 19);
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return `${normalized} 00:00:00`;
      return normalized;
    };
    const sorted = posicionSnapshots.slice().sort((a, b) =>
      String(b.fecha || "").localeCompare(String(a.fecha || ""))
    );
    const byDateTime = sorted.reduce((acc, snapshot) => {
      const key = snapshotDateTimeKey(snapshot.fecha);
      if (!acc[key]) acc[key] = [];
      acc[key].push(snapshot);
      return acc;
    }, {});
    return { sortedPosicionSnapshots: sorted, posicionSnapshotsByDateTime: byDateTime };
  }, [posicionSnapshots]);

  const snapshotDateKey = (value) => String(value || "").slice(0, 10);
  const visiblePosiciones = useMemo(
    () => sortedPosiciones.filter((posicion) => Number(posicion.cantidad || 0) > 0),
    [sortedPosiciones]
  );
  const activePosiciones = useMemo(
    () => posiciones.filter((posicion) => Number(posicion.cantidad || 0) > 0),
    [posiciones]
  );
  const portfolioValorActual = useMemo(
    () => activePosiciones.reduce((sum, posicion) => sum + Number(posicion?.valor_total || 0), 0),
    [activePosiciones]
  );
  const portfolioInversionResumenFormula = useMemo(() => ordenes.reduce((sum, orden) => {
    const tipo = String(orden?.tipo || "").trim().toLowerCase();
    const cantidad = Number(orden?.cantidad || 0);
    const precio = Number(orden?.precio || 0);
    const comision = Number(orden?.comision || 0);
    if (!Number.isFinite(cantidad) || !Number.isFinite(precio) || cantidad <= 0 || precio < 0) return sum;
    if (tipo === "compra") return sum + cantidad * precio + (Number.isFinite(comision) ? comision : 0);
    if (tipo === "venta") return sum - (cantidad * precio - (Number.isFinite(comision) ? comision : 0));
    return sum;
  }, 0), [ordenes]);
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
  const { posicionesPesoData, posicionesPesoTotal } = useMemo(() => {
    const raw = activePosiciones
      .map((posicion) => ({
        nombre: posicion?.activo_nombre || posicion?.ticker || `Posicion ${posicion?.id || ""}`,
        valor: Number(posicion?.valor_total || 0)
      }))
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor);
    const top = raw.slice(0, PIE_MAX_SLICES);
    const othersValue = raw.slice(PIE_MAX_SLICES).reduce((sum, item) => sum + Number(item?.valor || 0), 0);
    if (othersValue > 0) top.push({ nombre: "Otros", valor: othersValue });
    const total = top.reduce((sum, item) => sum + Number(item?.valor || 0), 0);
    return { posicionesPesoData: top, posicionesPesoTotal: total };
  }, [activePosiciones]);
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
  const sortedOrdenes = ordenes
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
  const pagedSnapshots = sortedPortfolioSnapshots.slice(
    (currentSnapshotsPage - 1) * LIST_PAGE_SIZE,
    currentSnapshotsPage * LIST_PAGE_SIZE
  );
  const pagedNotificaciones = sortedNotificaciones.slice(
    (currentNotificacionesPage - 1) * LIST_PAGE_SIZE,
    currentNotificacionesPage * LIST_PAGE_SIZE
  );
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


  const inicioPortfolioMonthlySeries = buildMonthlySeriesLastPoint(inicioPortfolioSeries);
  const inicioRentabilidadMonthlySeries = buildMonthlySeriesLastPoint(inicioRentabilidadSeries);
  const posicionesEvolutionMonthlySeries = buildMonthlySeriesLastPoint(posicionesEvolutionSeries);
  const posicionesRentabilidadMonthlySeries = buildMonthlySeriesLastPoint(posicionesRentabilidadSeries);

  const riskMetrics = (() => {
    const rawSeries = inicioRentabilidadSeries;
    if (rawSeries.length < 3) return null;
    const series = rawSeries.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    const values = series.map((p) => Number(p.rentabilidad || 0) + 100);
    const firstDate = new Date(series[0].fecha);
    const lastDate = new Date(series[series.length - 1].fecha);
    const daysDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
    const intervalDays = daysDiff / (series.length - 1);
    const periodsPerYear = 252 / Math.max(1, intervalDays);
    const returns = [];
    for (let i = 1; i < values.length; i++) returns.push((values[i] - values[i - 1]) / values[i - 1]);
    if (returns.length < 2) return null;
    const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const annualReturn = ((1 + meanReturn) ** periodsPerYear - 1) * 100;
    const volatility = stdDev * Math.sqrt(periodsPerYear) * 100;
    const sharpe = volatility > 0 ? annualReturn / volatility : 0;
    const negReturns = returns.filter((r) => r < 0);
    const downDev = negReturns.length > 0
      ? Math.sqrt(negReturns.reduce((s, r) => s + r ** 2, 0) / returns.length) * Math.sqrt(periodsPerYear) * 100
      : 0.001;
    const sortino = downDev > 0 ? annualReturn / downDev : 0;
    let peak = values[0], maxDD = 0;
    const drawdowns = [];
    for (const v of values) {
      if (v > peak) peak = v;
      const dd = ((v - peak) / peak) * 100;
      drawdowns.push(dd);
      if (dd < maxDD) maxDD = dd;
    }
    const calmar = maxDD !== 0 ? annualReturn / Math.abs(maxDD) : 0;
    const totalReturn = values[values.length - 1] / values[0] - 1;
    const yearsElapsed = daysDiff / 365.25;
    const cagr = yearsElapsed > 0 ? ((1 + totalReturn) ** (1 / yearsElapsed) - 1) * 100 : annualReturn;
    const winRate = (returns.filter((r) => r > 0).length / returns.length) * 100;
    const var95 = stdDev * Math.sqrt(1) * VAR_95_ZSCORE * 100;
    const painIndex = Math.abs(drawdowns.reduce((s, d) => s + d, 0) / drawdowns.length);
    const recoveryFactor = maxDD !== 0 ? cagr / Math.abs(maxDD) : 0;
    const fmt = (v) => Number.isFinite(v) ? Number(v.toFixed(2)) : 0;
    return {
      sharpe: fmt(sharpe), sortino: fmt(sortino), volatilidad: fmt(volatility),
      maxDrawdown: fmt(maxDD), calmar: fmt(calmar), cagr: fmt(cagr),
      winRate: fmt(winRate), annualReturn: fmt(annualReturn), var95: fmt(var95),
      painIndex: fmt(painIndex), recoveryFactor: fmt(recoveryFactor)
    };
  })();

  // "?�"? Risk metrics (Sharpe, Sortino, Vol, MaxDD, Calmar, CAGR) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

  // "?�"? Correlation matrix from posicion snapshots �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

  // "?�"? Preset historical scenarios (feature 1 + 15) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  // "?�"? Inconsistency warnings (feature 14) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  // "?�"? Objectives impact (feature 10) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  // "?�"? Monte Carlo extendido con rutas anuales (features 3,7,8,9,11) �"?�"?�"?�"?�"?�"?�"?�"?�"?
  // "?�"? Benchmark merged series for chart �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  // "?�"? Objetivos progreso �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
  const totalPortafolioValor = resumenes.reduce((s, r) => s + Number(r.totalCategoriaMoneda || 0), 0);


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
        <InicioPage
          usuario={usuario} loadingData={loadingData} loadingInicioCharts={loadingInicioCharts}
          loadingBenchmark={loadingBenchmark} error={error}
          inicioPortfolioSeries={inicioPortfolioSeries} inicioPortfolioKeys={inicioPortfolioKeys}
          inicioRentabilidadSeries={inicioRentabilidadSeries}
          inicioPortfolioChartMode={inicioPortfolioChartMode} setInicioPortfolioChartMode={setInicioPortfolioChartMode}
          inicioRentabilidadChartMode={inicioRentabilidadChartMode} setInicioRentabilidadChartMode={setInicioRentabilidadChartMode}
          hiddenInicioPortfolioKeys={hiddenInicioPortfolioKeys}
          benchmarkData={benchmarkData} benchmarkSymbol={benchmarkSymbol} setBenchmarkSymbol={setBenchmarkSymbol}
          showBenchmark={showBenchmark} setShowBenchmark={setShowBenchmark}
          monedaResumenTicker={monedaResumenTicker} totalResumenMoneda={totalResumenMoneda}
          resumenesConMetricas={resumenesConMetricas}
          totalInversionInicialResumen={totalInversionInicialResumen}
          totalPesoObjetivoResumen={totalPesoObjetivoResumen}
          totalRentabilidadResumen={totalRentabilidadResumen}
          resumenPieData={resumenPieData} resumenPieTotal={resumenPieTotal}
          savingResumenId={savingResumenId}
          riskMetrics={riskMetrics}
          showRiskInfo={showRiskInfo} setShowRiskInfo={setShowRiskInfo}
          getResumenPesoInputValue={getResumenPesoInputValue}
          handleResumenPesoDraftChange={handleResumenPesoDraftChange}
          commitResumenPesoObjetivo={commitResumenPesoObjetivo}
          resetResumenPesoDraft={resetResumenPesoDraft}
          handleInicioPortfolioLegendClick={handleInicioPortfolioLegendClick}
        />
      ) : null}

      {currentPage === "portafolio" ? (
        <PortafolioPage
          selectedPortafolio={selectedPortafolio} portafolios={portafolios}
          posiciones={posiciones} resumenPosiciones={resumenPosiciones} loadingPosiciones={loadingPosiciones}
          showOrdenForm={showOrdenForm} setShowOrdenForm={setShowOrdenForm}
          ordenTipo={ordenTipo} setOrdenTipo={setOrdenTipo}
          ordenActivoId={ordenActivoId} setOrdenActivoId={setOrdenActivoId}
          ordenActivoTicker={ordenActivoTicker} setOrdenActivoTicker={setOrdenActivoTicker}
          ordenPosicionId={ordenPosicionId} setOrdenPosicionId={setOrdenPosicionId}
          ordenCantidad={ordenCantidad} setOrdenCantidad={setOrdenCantidad}
          ordenPrecio={ordenPrecio} setOrdenPrecio={setOrdenPrecio}
          ordenComision={ordenComision} setOrdenComision={setOrdenComision}
          ordenObservacion={ordenObservacion} setOrdenObservacion={setOrdenObservacion}
          loadingActivoYahoo={loadingActivoYahoo}
          showPortafolioForm={showPortafolioForm} setShowPortafolioForm={setShowPortafolioForm}
          editingId={editingId} setEditingId={setEditingId}
          pfNombre={pfNombre} setPfNombre={setPfNombre}
          pfMonedaId={pfMonedaId} setPfMonedaId={setPfMonedaId}
          pfCategoriaId={pfCategoriaId} setPfCategoriaId={setPfCategoriaId}
          expandedPosicionId={expandedPosicionId} setExpandedPosicionId={setExpandedPosicionId}
          expandedPosicion={expandedPosicion} expandedPosicionActivo={expandedPosicionActivo}
          expandedPosicionIconSrc={expandedPosicionIconSrc}
          posicionesSort={posicionesSort} setPosicionesSort={setPosicionesSort}
          detalleAccionPosicion={detalleAccionPosicion} detalleFondoPosicion={detalleFondoPosicion}
          loadingDetallePosicion={loadingDetallePosicion}
          editingNotaPosicionId={editingNotaPosicionId} setEditingNotaPosicionId={setEditingNotaPosicionId}
          notaPosicionDraft={notaPosicionDraft} setNotaPosicionDraft={setNotaPosicionDraft}
          posicionesEvolutionSeries={posicionesEvolutionSeries} posicionesEvolutionKeys={posicionesEvolutionKeys}
          loadingPosicionCharts={loadingPosicionCharts}
          selectedPosicionChartKey={selectedPosicionChartKey} setSelectedPosicionChartKey={setSelectedPosicionChartKey}
          visiblePosicionChartKeys={visiblePosicionChartKeys}
          posicionesEvolutionChartMode={posicionesEvolutionChartMode} setPosicionesEvolutionChartMode={setPosicionesEvolutionChartMode}
          posicionesRentabilidadChartMode={posicionesRentabilidadChartMode} setPosicionesRentabilidadChartMode={setPosicionesRentabilidadChartMode}
          posicionesRentabilidadSeries={posicionesRentabilidadSeries}
          posicionesPesoChartMode={posicionesPesoChartMode} setPosicionesPesoChartMode={setPosicionesPesoChartMode}
          expandedOrdenId={expandedOrdenId} setExpandedOrdenId={setExpandedOrdenId}
          ordenes={ordenes} loadingOrdenes={loadingOrdenes}
          pagedOrdenes={pagedOrdenes} currentOrdenesPage={currentOrdenesPage}
          totalOrdenesPages={totalOrdenesPages} setOrdenesPage={setOrdenesPage}
          dividendos={dividendos} loadingDividendos={loadingDividendos}
          showDividendoForm={showDividendoForm} setShowDividendoForm={setShowDividendoForm}
          divPosicionId={divPosicionId} setDivPosicionId={setDivPosicionId}
          divFecha={divFecha} setDivFecha={setDivFecha}
          divImporte={divImporte} setDivImporte={setDivImporte}
          divMonedaId={divMonedaId} setDivMonedaId={setDivMonedaId}
          divObservacion={divObservacion} setDivObservacion={setDivObservacion}
          scenarioShocks={scenarioShocks} setScenarioShocks={setScenarioShocks}
          scenarioMode={scenarioMode} setScenarioMode={setScenarioMode}
          monteCarloYears={monteCarloYears} setMonteCarloYears={setMonteCarloYears}
          monteCarloRuns={monteCarloRuns} setMonteCarloRuns={setMonteCarloRuns}
          ruinThreshold={ruinThreshold} setRuinThreshold={setRuinThreshold}
          monthlyContribution={monthlyContribution} setMonthlyContribution={setMonthlyContribution}
          showMcRebalancing={showMcRebalancing} setShowMcRebalancing={setShowMcRebalancing}
          dividendYieldPct={dividendYieldPct} setDividendYieldPct={setDividendYieldPct}
          mcRetornoOverride={mcRetornoOverride} setMcRetornoOverride={setMcRetornoOverride}
          savedScenarios={savedScenarios} setSavedScenarios={setSavedScenarios}
          scenarioName={scenarioName} setScenarioName={setScenarioName}
          showImpactTable={showImpactTable} setShowImpactTable={setShowImpactTable}
          showWaterfall={showWaterfall} setShowWaterfall={setShowWaterfall}
          showScenarioTreemap={showScenarioTreemap} setShowScenarioTreemap={setShowScenarioTreemap}
          showSavedScenarios={showSavedScenarios} setShowSavedScenarios={setShowSavedScenarios}
          riskMetrics={riskMetrics} portfolioRentabilidadPct={portfolioRentabilidadPct}
          objetivos={objetivos}
          activos={activos} monedas={monedas} categorias={categorias}
          loading={loading} error={error}
          handlePortafolioSubmit={handlePortafolioSubmit}
          handleOrdenSubmit={handleOrdenSubmit}
          handleDeleteOrden={handleDeleteOrden}
          handleImportActivoDesdeYahoo={handleImportActivoDesdeYahoo}
          handleCrearDividendo={handleCrearDividendo}
          handleEliminarDividendo={handleEliminarDividendo}
          handleAddPosicionLine={handleAddPosicionLine}
          handleRemovePosicionLine={handleRemovePosicionLine}
          handleGuardarNotaPosicion={handleGuardarNotaPosicion}
          clearPortafolioForm={clearPortafolioForm}
          clearOrdenForm={clearOrdenForm}
        />
      ) : null}

      {currentPage === "noticias" ? (
        <NoticiasPage
          loading={loadingNoticias}
          noticias={noticiasRecientes}
          fetchedAt={noticiasFetchedAt}
          error={error}
          onRefresh={() => loadNoticiasData()}
        />
      ) : null}

      {currentPage === "cashflow" ? (
        <CashflowPage
          cashFlows={cashFlows} cashFlowResumen={cashFlowResumen} loadingCashFlow={loadingCashFlow}
          showCashFlowForm={showCashFlowForm} setShowCashFlowForm={setShowCashFlowForm}
          cashFlowCalendarCursor={cashFlowCalendarCursor} setCashFlowCalendarCursor={setCashFlowCalendarCursor}
          cashFlowSelectedDate={cashFlowSelectedDate} setCashFlowSelectedDate={setCashFlowSelectedDate}
          cashFlowSelectedMonthType={cashFlowSelectedMonthType} setCashFlowSelectedMonthType={setCashFlowSelectedMonthType}
          editingCashFlowId={editingCashFlowId}
          cashFlowTipo={cashFlowTipo} setCashFlowTipo={setCashFlowTipo}
          cashFlowCategoria={cashFlowCategoria} setCashFlowCategoria={setCashFlowCategoria}
          cashFlowMonedaId={cashFlowMonedaId} setCashFlowMonedaId={setCashFlowMonedaId}
          cashFlowNombre={cashFlowNombre} setCashFlowNombre={setCashFlowNombre}
          cashFlowFecha={cashFlowFecha} setCashFlowFecha={setCashFlowFecha}
          cashFlowAporte={cashFlowAporte} setCashFlowAporte={setCashFlowAporte}
          cashFlowObservacion={cashFlowObservacion} setCashFlowObservacion={setCashFlowObservacion}
          monedas={monedas} monedaResumenTicker={monedaResumenTicker}
          loading={loading} error={error}
          movimientosPage={movimientosPage} setMovimientosPage={setMovimientosPage}
          onSubmit={handleCashFlowSubmit}
          onDelete={handleDeleteCashFlow}
          onEdit={startEditCashFlow}
          onClearForm={clearCashFlowForm}
        />
      ) : null}


      {currentPage === "watchlist" ? (
        <WatchlistPage
          watchlist={watchlist} loadingWatchlist={loadingWatchlist}
          showWatchlistForm={showWatchlistForm} setShowWatchlistForm={setShowWatchlistForm}
          watchlistActivoTicker={watchlistActivoTicker} setWatchlistActivoTicker={setWatchlistActivoTicker}
          watchlistNota={watchlistNota} setWatchlistNota={setWatchlistNota}
          precioAlertas={precioAlertas} loadingAlertas={loadingAlertas}
          showAlertaForm={showAlertaForm} setShowAlertaForm={setShowAlertaForm}
          alertaActivoId={alertaActivoId} setAlertaActivoId={setAlertaActivoId}
          alertaTipo={alertaTipo} setAlertaTipo={setAlertaTipo}
          alertaPrecio={alertaPrecio} setAlertaPrecio={setAlertaPrecio}
          activos={activos} loading={loading} error={error}
          onCrearWatchlist={handleCrearWatchlistItem}
          onEliminarWatchlist={handleEliminarWatchlistItem}
          onCrearAlerta={handleCrearAlerta}
          onEliminarAlerta={handleEliminarAlerta}
        />
      ) : null}

      {currentPage === "objetivos" ? (
        <ObjetivosPage
          objetivos={objetivos} loadingObjetivos={loadingObjetivos}
          showForm={showObjetivoForm} editingId={editingObjetivoId}
          nombre={objNombre} setNombre={setObjNombre}
          montoObjetivo={objMontoObjetivo} setMontoObjetivo={setObjMontoObjetivo}
          fechaObjetivo={objFechaObjetivo} setFechaObjetivo={setObjFechaObjetivo}
          montoInicial={objMontoInicial} setMontoInicial={setObjMontoInicial}
          nota={objNota} setNota={setObjNota}
          portafolioIds={objetivoPortafolioIds} setPortafolioIds={setObjetivoPortafolioIds}
          portafolios={portafolios} resumenes={resumenes}
          totalPortafolioValor={totalPortafolioValor} monedaTicker={monedaResumenTicker}
          loading={loading} error={error}
          onSubmit={handleObjetivoSubmit}
          onEliminar={handleEliminarObjetivo}
          onNuevo={() => { clearObjetivoForm(); setShowObjetivoForm((prev) => !prev); }}
          onEditar={handleEditarObjetivo}
        />
      ) : null}


      {currentPage === "snapshots" ? (
        <SnapshotsPage
          portafolios={portafolios} loadingSnapshots={loadingSnapshots}
          snapshotPortafolioId={snapshotPortafolioId} setSnapshotPortafolioId={setSnapshotPortafolioId}
          snapshotFechaInicio={snapshotFechaInicio} setSnapshotFechaInicio={setSnapshotFechaInicio}
          snapshotFechaFin={snapshotFechaFin} setSnapshotFechaFin={setSnapshotFechaFin}
          portfolioSnapshots={portfolioSnapshots} sortedPortfolioSnapshots={sortedPortfolioSnapshots}
          pagedSnapshots={pagedSnapshots}
          currentSnapshotsPage={currentSnapshotsPage} totalSnapshotsPages={totalSnapshotsPages}
          setSnapshotsPage={setSnapshotsPage}
          posicionSnapshotsByDateTime={posicionSnapshotsByDateTime}
          firstPortfolioSnapshot={firstPortfolioSnapshot} lastPortfolioSnapshot={lastPortfolioSnapshot}
          portfolioVariacion={portfolioVariacion} portfolioVariacionPct={portfolioVariacionPct}
          expandedPortfolioSnapshotId={expandedPortfolioSnapshotId}
          setExpandedPortfolioSnapshotId={setExpandedPortfolioSnapshotId}
          error={error}
          onConsultar={async (e) => { e.preventDefault(); await loadSnapshotsData(); }}
          onGenerarManual={handleGenerarSnapshotManual}
          onGenerarTodos={handleGenerarSnapshotsTodos}
          onEliminarSnapshot={handleEliminarSnapshotPortafolio}
        />
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
            {portafolios.map((p) => (
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
          <SettingsPage
            usuario={usuario} loading={loading} error={error}
            pwNuevo={pwNuevo} setPwNuevo={setPwNuevo}
            pwConfirmar={pwConfirmar} setPwConfirmar={setPwConfirmar}
            showPwNuevo={showPwNuevo} setShowPwNuevo={setShowPwNuevo}
            showPwConfirmar={showPwConfirmar} setShowPwConfirmar={setShowPwConfirmar}
            pwMessage={pwMessage}
            darkMode={darkMode} setDarkMode={setDarkMode}
            settingsMonedaId={settingsMonedaId} setSettingsMonedaId={setSettingsMonedaId}
            monedas={monedas}
            snapshotConfigEnabled={snapshotConfigEnabled}
            setSnapshotConfigEnabled={setSnapshotConfigEnabled}
            snapshotIntervalPortafolio={snapshotIntervalPortafolio}
            setSnapshotIntervalPortafolio={setSnapshotIntervalPortafolio}
            setSnapshotIntervalPosicion={setSnapshotIntervalPosicion}
            loadingNotificaciones={loadingNotificaciones}
            unreadNotificaciones={unreadNotificaciones}
            sortedNotificaciones={sortedNotificaciones}
            pagedNotificaciones={pagedNotificaciones}
            currentNotificacionesPage={currentNotificacionesPage}
            totalNotificacionesPages={totalNotificacionesPages}
            setNotificacionesPage={setNotificacionesPage}
            onCambiarPassword={handleCambiarPassword}
            onSaveMoneda={handleSaveMonedaUsuario}
            onSaveSnapshot={handleSaveSnapshotConfig}
            onMarkAllRead={handleMarkAllNotificacionesRead}
            onMarkRead={handleMarkNotificacionRead}
            onDismissAll={handleDismissAllNotificaciones}
            onLogout={logout}
          />
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
