import { Fragment, useMemo } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, Treemap, XAxis, YAxis
} from "recharts";
import { formatPrice, formatPercent, formatPriceOrDashZero, formatLargeNumberOrDashZero, formatPercentOrDashZero, formatSnapshotDate } from "../utils/format.js";
import { CHART_COLORS, VAR_95_ZSCORE } from "../utils/constants.js";
import { renderPiePercentLabel, buildPiePercentTooltipFormatter, renderDirectionBadge } from "../utils/chartHelpers.jsx";
import { buildMonthlySeriesLastPoint } from "../utils/chartBuilders.js";
import { resolvePosicionLogoSrc } from "../utils/assetIcons.js";
import Pagination from "../components/Pagination.jsx";

const PRESET_SCENARIOS = [
  { label: "Crisis 2008", icon: "📉", description: "Crisis financiera global — S&P 500 -57%", shocks: { default: -50, "renta fija": -5, "bono": -5, "liquidez": 0, "cash": 0 } },
  { label: "COVID-19", icon: "🦠", description: "Pandemia 2020 — Caída rápida (-35%) y recuperación", shocks: { default: -35, "tecnolog": 25, "tech": 25, "farmaceut": 20, "salud": 20, "liquidez": 0 } },
  { label: "Punto-com", icon: "💻", description: "Burbuja tecnológica 2000 — Nasdaq -78%", shocks: { default: -25, "tecnolog": -78, "tech": -78, "software": -78, "semicon": -60 } },
  { label: "Corrección 2022", icon: "📊", description: "Subida de tipos — Tecnología y bonos caen", shocks: { default: -20, "tecnolog": -35, "tech": -35, "renta fija": -15, "bono": -15, "energía": 25, "energy": 25 } },
  { label: "Inflación extrema", icon: "💸", description: "Escenario de hiperinflación — Activos reales ganan", shocks: { default: -30, "renta fija": -40, "bono": -40, "liquidez": -20, "oro": 50, "materia": 40, "real estate": 20, "inmobiliario": 20 } },
  { label: "Recesión moderada", icon: "⚠️", description: "Recesión suave — Caída controlada en renta variable", shocks: { default: -15, "renta fija": 10, "bono": 10, "liquidez": 0, "oro": 10 } },
];

const BETA_MULTIPLIERS = [
  { keys: ["criptomoneda", "crypto", "bitcoin", "ethereum"], beta: 2.5 },
  { keys: ["tecnolog", "tech", "software", "semiconductor", "semicon"], beta: 1.4 },
  { keys: ["renta variable", "accion", "equity", "etf de accion"], beta: 1.0 },
  { keys: ["salud", "farmaceut", "biotech"], beta: 0.7 },
  { keys: ["consumo basico", "utilities", "utility", "infraestructura"], beta: 0.5 },
  { keys: ["renta fija", "bono", "bond", "deuda", "fixed income"], beta: 0.3 },
  { keys: ["oro", "materia prima", "commodit", "real estate", "inmobiliario"], beta: 0.6 },
  { keys: ["liquidez", "cash", "monetario"], beta: 0.05 },
];

export default function PortafolioPage({
  selectedPortafolio, portafolios, posiciones, resumenPosiciones, loadingPosiciones,
  showOrdenForm, setShowOrdenForm,
  ordenTipo, setOrdenTipo, ordenActivoId, setOrdenActivoId,
  ordenActivoTicker, setOrdenActivoTicker, ordenPosicionId, setOrdenPosicionId,
  ordenCantidad, setOrdenCantidad, ordenPrecio, setOrdenPrecio,
  ordenComision, setOrdenComision, ordenObservacion, setOrdenObservacion,
  loadingActivoYahoo,
  showPortafolioForm, setShowPortafolioForm, editingId, setEditingId,
  pfNombre, setPfNombre, pfMonedaId, setPfMonedaId, pfCategoriaId, setPfCategoriaId,
  expandedPosicionId, setExpandedPosicionId,
  expandedPosicion, expandedPosicionActivo, expandedPosicionIconSrc,
  posicionesSort, setPosicionesSort,
  detalleAccionPosicion, detalleFondoPosicion, loadingDetallePosicion,
  editingNotaPosicionId, setEditingNotaPosicionId,
  notaPosicionDraft, setNotaPosicionDraft,
  posicionesEvolutionSeries, posicionesEvolutionKeys, loadingPosicionCharts,
  selectedPosicionChartKey, setSelectedPosicionChartKey, visiblePosicionChartKeys,
  posicionesEvolutionChartMode, setPosicionesEvolutionChartMode,
  posicionesRentabilidadChartMode, setPosicionesRentabilidadChartMode,
  posicionesRentabilidadSeries,
  posicionesPesoChartMode, setPosicionesPesoChartMode,
  expandedOrdenId, setExpandedOrdenId,
  ordenes, loadingOrdenes,
  pagedOrdenes, currentOrdenesPage, totalOrdenesPages, setOrdenesPage,
  dividendos, loadingDividendos,
  showDividendoForm, setShowDividendoForm,
  divPosicionId, setDivPosicionId, divFecha, setDivFecha,
  divImporte, setDivImporte, divMonedaId, setDivMonedaId, divObservacion, setDivObservacion,
  scenarioShocks, setScenarioShocks, scenarioMode, setScenarioMode,
  monteCarloYears, setMonteCarloYears, monteCarloRuns, setMonteCarloRuns,
  ruinThreshold, setRuinThreshold, monthlyContribution, setMonthlyContribution,
  showMcRebalancing, setShowMcRebalancing, dividendYieldPct, setDividendYieldPct,
  mcRetornoOverride, setMcRetornoOverride,
  savedScenarios, setSavedScenarios, scenarioName, setScenarioName,
  showImpactTable, setShowImpactTable, showWaterfall, setShowWaterfall,
  showScenarioTreemap, setShowScenarioTreemap, showSavedScenarios, setShowSavedScenarios,
  riskMetrics, portfolioRentabilidadPct, objetivos,
  activos, monedas, categorias, loading, error,
  handlePortafolioSubmit, handleOrdenSubmit, handleDeleteOrden,
  handleImportActivoDesdeYahoo, handleCrearDividendo, handleEliminarDividendo,
  handleAddPosicionLine, handleRemovePosicionLine, handleGuardarNotaPosicion,
  clearPortafolioForm, clearOrdenForm,
}) {
  function getNextSortState(currentSort, key, defaultDirection = "asc") {
    if (currentSort.key === key) return { key, direction: currentSort.direction === "asc" ? "desc" : "asc" };
    return { key, direction: defaultDirection };
  }
  function getSortIndicator(currentSort, key) {
    if (currentSort.key !== key) return "<>";
    return currentSort.direction === "asc" ? "^" : "v";
  }

  const sortedOrdenes = useMemo(() => ordenes.slice().sort((a, b) => {
    const d = String(b.fecha || "").localeCompare(String(a.fecha || ""));
    return d !== 0 ? d : Number(b.id || 0) - Number(a.id || 0);
  }), [ordenes]);

  const visiblePosiciones = useMemo(() => {
    const numericKeys = ["variacion_diaria", "precio_actual", "valor_total", "rentabilidad"];
    return posiciones.slice().sort((a, b) => {
      const dir = posicionesSort.direction === "asc" ? 1 : -1;
      if (numericKeys.includes(posicionesSort.key)) return (Number(a[posicionesSort.key] || 0) - Number(b[posicionesSort.key] || 0)) * dir;
      return String(a?.[posicionesSort.key] || "").localeCompare(String(b?.[posicionesSort.key] || ""), "es", { sensitivity: "base" }) * dir;
    }).filter((p) => Number(p.cantidad || 0) > 0);
  }, [posiciones, posicionesSort]);

  const posicionesEvolutionMonthlySeries = useMemo(() => buildMonthlySeriesLastPoint(posicionesEvolutionSeries), [posicionesEvolutionSeries]);
  const posicionesRentabilidadMonthlySeries = useMemo(() => buildMonthlySeriesLastPoint(posicionesRentabilidadSeries), [posicionesRentabilidadSeries]);

  const { posicionesPesoChartData, posicionesPesoChartTotal } = useMemo(() => {
    const active = posiciones.filter((p) => Number(p.cantidad || 0) > 0);
    if (posicionesPesoChartMode === "sector") {
      const byS = active.reduce((acc, p) => {
        const k = p.sector_nombre || "Sin sector";
        acc[k] = (acc[k] || 0) + Number(p.valor_total || 0);
        return acc;
      }, {});
      const data = Object.entries(byS).map(([nombre, valor]) => ({ nombre, valor })).filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor);
      return { posicionesPesoChartData: data, posicionesPesoChartTotal: data.reduce((s, i) => s + i.valor, 0) };
    }
    const raw = active.map((p) => ({ nombre: p.activo_nombre || p.ticker || `Pos ${p.id}`, valor: Number(p.valor_total || 0) })).filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor);
    const top = raw.slice(0, 7);
    const othersVal = raw.slice(7).reduce((s, i) => s + i.valor, 0);
    if (othersVal > 0) top.push({ nombre: "Otros", valor: othersVal });
    return { posicionesPesoChartData: top, posicionesPesoChartTotal: top.reduce((s, i) => s + i.valor, 0) };
  }, [posiciones, posicionesPesoChartMode]);

  const heatmapData = useMemo(() => posiciones.filter((p) => Number(p.cantidad || 0) > 0 && Number(p.valor_total || 0) > 0).map((p) => {
    const hasMarket = Number.isFinite(Number(p.variacion_diaria)) && p.variacion_diaria !== null;
    return {
      name: (p.ticker || p.activo_nombre || "?").slice(0, 8),
      size: Number(p.valor_total || 0),
      variacion: hasMarket ? Number(p.variacion_diaria || 0) : Number(p.rentabilidad || 0),
      variacionEsDiaria: hasMarket,
      peso: Number(p.valor_total || 0)
    };
  }), [posiciones]);

  const dividendosTotalAnio = useMemo(() => dividendos.filter((d) => String(d.fecha || "").startsWith(String(new Date().getFullYear()))).reduce((s, d) => s + Number(d.importe || 0), 0), [dividendos]);
  const dividendosTotalHistorico = useMemo(() => dividendos.reduce((s, d) => s + Number(d.importe || 0), 0), [dividendos]);

  const scenarioCategories = useMemo(() => posiciones.filter((p) => Number(p.cantidad || 0) > 0).reduce((acc, p) => {
    const cat = String(p.categoria_nombre || p.activo_categoria_nombre || p.categoria || "Otros").trim();
    acc[cat] = (acc[cat] || 0) + Number(p.valor_total || 0);
    return acc;
  }, {}), [posiciones]);

  const scenarioCurrentTotal = useMemo(() => posiciones.filter((p) => Number(p.cantidad || 0) > 0).reduce((s, p) => s + Number(p.valor_total || 0), 0), [posiciones]);

  function getCategoryBeta(categoryName) {
    const name = String(categoryName || "").toLowerCase();
    for (const { keys, beta } of BETA_MULTIPLIERS) {
      if (keys.some((k) => name.includes(k))) return beta;
    }
    return 1.0;
  }

  const effectiveShocks = scenarioShocks;

  const scenarioResultFinal = useMemo(() => posiciones.filter((p) => Number(p.cantidad || 0) > 0).reduce((total, p) => {
    const shock = Number(effectiveShocks[String(p.id)] || 0) / 100;
    return total + Number(p.valor_total || 0) * (1 + shock);
  }, 0), [posiciones, effectiveShocks]);

  const { scenarioBarData, waterfallData, scenarioTreemapData, impactTableData } = useMemo(() => {
    const active = posiciones.filter((p) => Number(p.cantidad || 0) > 0);
    const barData = active.map((p) => { const shock = Number(effectiveShocks[String(p.id)] || 0) / 100; const val = Number(p.valor_total || 0); return { name: (p.ticker || p.activo_nombre || "?").slice(0, 10), actual: Number(val.toFixed(2)), escenario: Number((val * (1 + shock)).toFixed(2)) }; });
    const wfData = active.map((p) => { const shock = Number(effectiveShocks[String(p.id)] || 0) / 100; const val = Number(p.valor_total || 0); return { name: (p.ticker || p.activo_nombre || "?").slice(0, 10), delta: Number((val * shock).toFixed(2)) }; }).sort((a, b) => a.delta - b.delta);
    const tmData = active.map((p) => ({ name: (p.ticker || p.activo_nombre || "?").slice(0, 12), size: Number(p.valor_total || 0), shock: Number(effectiveShocks[String(p.id)] || 0) })).filter((i) => i.size > 0);
    const tableData = active.map((p) => { const shock = Number(effectiveShocks[String(p.id)] || 0) / 100; const val = Number(p.valor_total || 0); const newVal = val * (1 + shock); return { name: p.activo_nombre || p.ticker || "?", ticker: p.ticker || "-", actual: val, escenario: newVal, delta: newVal - val, shockPct: shock * 100 }; }).sort((a, b) => a.delta - b.delta);
    return { scenarioBarData: barData, waterfallData: wfData, scenarioTreemapData: tmData, impactTableData: tableData };
  }, [posiciones, effectiveShocks]);

  const dynamicVar95 = scenarioResultFinal > 0 && riskMetrics ? scenarioResultFinal * (Number(riskMetrics.volatilidad) / 100) / Math.sqrt(252) * VAR_95_ZSCORE : null;

  const scenarioWarnings = useMemo(() => {
    const warnings = [];
    const shockValues = Object.values(effectiveShocks).map(Number);
    if (!shockValues.length) return warnings;
    let bondShock = null, equityShock = null;
    for (const [cat, shock] of Object.entries(effectiveShocks)) {
      const k = cat.toLowerCase();
      if (["renta fija","bono","bond"].some((b) => k.includes(b))) bondShock = Number(shock);
      if (["renta variable","accion","etf"].some((e) => k.includes(e))) equityShock = Number(shock);
    }
    if (bondShock !== null && equityShock !== null && bondShock > 15 && equityShock > 15) warnings.push("Bonos y renta variable subiendo mucho simultáneamente es poco habitual.");
    if (bondShock !== null && bondShock > 20) warnings.push("Una subida de bonos >20% implicaría una bajada drástica de tipos, un escenario extremo.");
    const cryptoEntry = Object.entries(effectiveShocks).find(([k]) => k.toLowerCase().includes("crypto") || k.toLowerCase().includes("criptomoneda"));
    if (cryptoEntry && Math.abs(Number(cryptoEntry[1])) > 70) warnings.push(`Shock en crypto de ${cryptoEntry[1]}%: histórico pero posible.`);
    return warnings;
  }, [effectiveShocks]);

  const objetivosImpact = useMemo(() => (objetivos || []).map((obj) => {
    const target = Number(obj.monto_objetivo || 0);
    const progActual = target > 0 ? (scenarioCurrentTotal / target) * 100 : 0;
    const progEscenario = target > 0 ? (scenarioResultFinal / target) * 100 : 0;
    return { ...obj, progActual, progEscenario, delta: progEscenario - progActual };
  }), [objetivos, scenarioCurrentTotal, scenarioResultFinal]);

  const monteCarloData = useMemo(() => {
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
    function simulate(s0, sig) {
      const yearlyVals = Array.from({ length: years + 1 }, () => []);
      yearlyVals[0] = Array(runs).fill(s0);
      const finals = [];
      for (let r = 0; r < runs; r++) {
        let v = s0;
        for (let y = 1; y <= years; y++) {
          for (let m = 0; m < 12; m++) {
            v = v * Math.exp((mu - 0.5 * sig * sig) * dt + sig * Math.sqrt(dt) * gauss()) + contrib;
            if (v < 0) v = 0;
          }
          yearlyVals[y].push(v);
        }
        finals.push(v);
      }
      finals.sort((a, b) => a - b);
      const pct = (f) => finals[Math.floor(runs * f)] ?? finals[finals.length - 1];
      const data = yearlyVals.map((yv, yi) => {
        const sorted = [...yv].sort((a, b) => a - b);
        const p = (f) => sorted[Math.floor(runs * f)] ?? sorted[sorted.length - 1];
        return { year: `Año ${yi}`, p10: Number(p(0.10).toFixed(0)), p25: Number(p(0.25).toFixed(0)), p50: Number(p(0.50).toFixed(0)), p75: Number(p(0.75).toFixed(0)), p90: Number(p(0.90).toFixed(0)) };
      });
      const ruinCount = finals.filter((v) => v < s0 * (ruinThreshold / 100)).length;
      return { data, finals, p10: pct(0.10), p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90), ruinProb: (ruinCount / runs) * 100 };
    }
    const base = simulate(scenarioCurrentTotal, sigma);
    const rebal = showMcRebalancing ? simulate(scenarioCurrentTotal, sigmaRebal) : null;
    return { ...base, rebal };
  }, [riskMetrics, scenarioCurrentTotal, mcRetornoOverride, dividendYieldPct, monteCarloYears, monteCarloRuns, monthlyContribution, showMcRebalancing, ruinThreshold]);

  const correlationMatrix = useMemo(() => {
    const keys = posicionesEvolutionKeys.slice(0, 6);
    if (keys.length < 2 || posicionesEvolutionSeries.length < 4) return null;
    const getReturns = (key) => {
      const vals = posicionesEvolutionSeries.map((p) => Number(p[key] || 0));
      const rets = [];
      for (let i = 1; i < vals.length; i++) {
        rets.push(vals[i - 1] !== 0 ? (vals[i] - vals[i - 1]) / vals[i - 1] : 0);
      }
      return rets;
    };
    const seriesReturns = keys.map((k) => getReturns(k.key));
    const pearson = (a, b) => {
      const n = Math.min(a.length, b.length);
      if (n < 2) return 0;
      const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
      const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < n; i++) {
        const diffA = a[i] - meanA, diffB = b[i] - meanB;
        num += diffA * diffB; da += diffA ** 2; db += diffB ** 2;
      }
      return da > 0 && db > 0 ? num / Math.sqrt(da * db) : (da === 0 && db === 0 ? 1 : 0);
    };
    const matrix = keys.map((_, i) => keys.map((__, j) => Number(pearson(seriesReturns[i], seriesReturns[j]).toFixed(3))));
    return { keys, matrix };
  }, [posicionesEvolutionKeys, posicionesEvolutionSeries]);

  function applyPreset(preset) {
    const newShocks = {};
    for (const p of posiciones.filter((p) => Number(p.cantidad || 0) > 0)) {
      const cat = String(p.categoria_nombre || p.activo_categoria_nombre || p.categoria || "Otros").toLowerCase();
      let shock = preset.shocks.default ?? 0;
      for (const [key, val] of Object.entries(preset.shocks)) {
        if (key !== "default" && cat.includes(key.toLowerCase())) { shock = val; break; }
      }
      newShocks[String(p.id)] = shock;
    }
    setScenarioShocks(newShocks);
    setScenarioMode("position");
  }

  function applyRandomShock() {
    const rand = Math.random();
    let marketShock;
    if (rand < 0.20) marketShock = -(20 + Math.random() * 30);
    else if (rand < 0.40) marketShock = -(8 + Math.random() * 12);
    else if (rand < 0.65) marketShock = -8 + Math.random() * 16;
    else if (rand < 0.85) marketShock = 8 + Math.random() * 12;
    else marketShock = 20 + Math.random() * 20;
    marketShock = Math.round(marketShock * 10) / 10;
    const newShocks = {};
    for (const p of posiciones.filter((p) => Number(p.cantidad || 0) > 0)) {
      const cat = String(p.categoria_nombre || p.activo_categoria_nombre || "").toLowerCase();
      const beta = getCategoryBeta(cat);
      const posShock = Math.round(marketShock * beta * (0.8 + Math.random() * 0.4) * 10) / 10;
      newShocks[String(p.id)] = Math.max(-80, Math.min(80, posShock));
    }
    setScenarioShocks(newShocks);
    setScenarioMode("position");
  }

  return (
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
                <Pagination currentPage={currentOrdenesPage} totalPages={totalOrdenesPages} onPageChange={setOrdenesPage} />
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
                            title={`${ki.label} -?" ${correlationMatrix.keys[colIdx].label}: ${v.toFixed(2)}`}>
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

              {/* �"?�"? 1+15: Escenarios predefinidos / Stress tests �"?�"? */}
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
                    YZ Aleatorio coherente
                  </button>
                  <button type="button" className="buttonSecondary"
                    style={{ fontSize: "0.73rem", padding: "3px 10px", marginLeft: "auto" }}
                    onClick={() => setScenarioShocks({})}>
                    ? Reset
                  </button>
                </div>
              </div>

              {/* �"?�"? Shocks + Resultado + Gráfico de impacto �"?�"? */}
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
                  {/* �"?�"? Resultado + 13: VaR dinámico �"?�"? */}
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

              {/* �"?�"? 14: Advertencias de inconsistencia �"?�"? */}
              {scenarioWarnings.length > 0 ? (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--amber-50)", border: "1px solid var(--amber-500)", borderRadius: "var(--radius-md)" }}>
                  <strong style={{ fontSize: "0.78rem", color: "var(--amber-600)" }}>!s! Advertencias de consistencia</strong>
                  {scenarioWarnings.map((w, i) => (
                    <p key={i} style={{ fontSize: "0.75rem", color: "var(--amber-600)", margin: "4px 0 0" }}>{w}</p>
                  ))}
                </div>
              ) : null}

              {/* �"?�"? Toggles de vistas adicionales �"?�"? */}
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

              {/* �"?�"? 4: Tabla de impacto detallada �"?�"? */}
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

              {/* �"?�"? 5: Gráfico cascada (waterfall) �"?�"? */}
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

              {/* �"?�"? 6: Mapa de impacto (Treemap) �"?�"? */}
              {showScenarioTreemap && scenarioTreemapData.length > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <strong style={{ fontSize: "0.82rem" }}>Mapa de impacto -?" tamaño = valor, color = shock</strong>
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

              {/* �"?�"? 10: Impacto en objetivos �"?�"? */}
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

              {/* �"?�"? 12: Guardar y comparar escenarios �"?�"? */}
              {showSavedScenarios ? (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <strong style={{ fontSize: "0.82rem" }}>Guardar escenario actual</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                    <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Nombre del escenario?"
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
                                  o.
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

              {/* �"?�"? Monte Carlo (features 3,7,8,9,11) �"?�"? */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Monte Carlo</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", cursor: "help", borderBottom: "1px dotted var(--text-muted)" }}
                    title="Movimiento Browniano Geométrico (GBM): simula la evolución del portafolio asumiendo que los retornos siguen una distribución log-normal. En cada paso mensual: V(t+1) = V(t) · exp((μ - �f²/2)·dt + �f·�^sdt·Z), donde Z ~ N(0,1). Es el modelo estándar en finanzas cuantitativas (Black-Scholes). Los parámetros μ (retorno) y �f (volatilidad) se estiman de los snapshots históricos.">
                    ¿Qué es GBM? ?"~
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
                            ?
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
                              <Area type="monotone" dataKey="p90" name="P10-P90" fill="rgba(59,130,246,0.08)" stroke="none" legendType="none" />
                              <Area type="monotone" dataKey="p10" name="_" fill="var(--bg-surface)" stroke="none" legendType="none" />
                              {/* Banda P25-P75 */}
                              <Area type="monotone" dataKey="p75" name="P25-P75" fill="rgba(59,130,246,0.14)" stroke="none" legendType="none" />
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
  );
}
