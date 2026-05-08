import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart,
  Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { buildMonthlySeriesLastPoint } from "../utils/chartBuilders.js";
import { CHART_COLORS } from "../utils/constants.js";
import { renderPiePercentLabel, buildPiePercentTooltipFormatter } from "../utils/chartHelpers.jsx";

const REBALANCE_THRESHOLD = 5;

export default function InicioPage({
  usuario, loadingData, loadingInicioCharts, loadingBenchmark, error,
  // series estado (cargadas async)
  inicioPortfolioSeries, inicioPortfolioKeys, inicioRentabilidadSeries,
  inicioPortfolioChartMode, setInicioPortfolioChartMode,
  inicioRentabilidadChartMode, setInicioRentabilidadChartMode,
  hiddenInicioPortfolioKeys,
  benchmarkData, benchmarkSymbol, setBenchmarkSymbol,
  showBenchmark, setShowBenchmark,
  // datos de resumen (computados en App.jsx, compartidos con otras páginas)
  monedaResumenTicker, totalResumenMoneda, resumenesConMetricas,
  totalInversionInicialResumen, totalPesoObjetivoResumen, totalRentabilidadResumen,
  resumenPieData, resumenPieTotal,
  // estado de edición de pesos
  savingResumenId, riskMetrics, showRiskInfo, setShowRiskInfo,
  // handlers
  getResumenPesoInputValue, handleResumenPesoDraftChange,
  commitResumenPesoObjetivo, resetResumenPesoDraft,
  handleInicioPortfolioLegendClick
}) {
  // Alertas de rebalanceo
  const resumenesConAlerta = resumenesConMetricas.map((r) => ({
    ...r,
    needsRebalance: Math.abs(r.peso - Number(r.pesoObjetivo || 0)) > REBALANCE_THRESHOLD
  }));

  // Series mensuales
  const inicioPortfolioMonthlySeries = buildMonthlySeriesLastPoint(inicioPortfolioSeries);
  const inicioRentabilidadMonthlySeries = buildMonthlySeriesLastPoint(inicioRentabilidadSeries);

  // Benchmark merged
  const inicioRentabilidadWithBenchmark = (() => {
    const base = inicioRentabilidadMonthlySeries;
    if (!showBenchmark || !benchmarkData.length) return base;
    const benchMap = new Map();
    for (const b of benchmarkData) {
      const raw = String(b.fecha || "");
      const mk = raw.slice(0, 7);
      if (!benchMap.has(mk)) benchMap.set(mk, Number(b.rentabilidad || 0));
      const d = new Date(raw + "T00:00:00Z");
      if (!Number.isNaN(d.getTime())) {
        const day = d.getUTCDate();
        const daysInMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
        if (day >= daysInMonth - 2) {
          const nextKey = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 1).toISOString().slice(0, 7);
          if (!benchMap.has(nextKey)) benchMap.set(nextKey, Number(b.rentabilidad || 0));
        }
      }
    }
    return base.map((point) => {
      const monthKey = String(point.mes || point.fecha || "").slice(0, 7);
      return { ...point, benchmark: benchMap.get(monthKey) ?? null };
    });
  })();


  const RISK_INFO = {
    sharpe: { label: "Sharpe Ratio", color: (v) => Number(v) >= 1 ? "var(--green-600)" : Number(v) >= 0 ? "var(--amber-600)" : "var(--red-600)", suffix: "", explain: "Mide el retorno extra por unidad de riesgo total. Sharpe > 1 es bueno, > 2 muy bueno, < 0 indica pérdida ajustada al riesgo." },
    sortino: { label: "Sortino Ratio", color: (v) => Number(v) >= 1 ? "var(--green-600)" : Number(v) >= 0 ? "var(--amber-600)" : "var(--red-600)", suffix: "", explain: "Como Sharpe pero solo penaliza la volatilidad negativa (bajadas). Sortino > 2 es excelente." },
    volatilidad: { label: "Volatilidad anual", color: () => "var(--text-primary)", suffix: "%", explain: "Desviación estándar de los retornos diarios escalada a un año. Mercados maduros suelen tener 15-20%." },
    maxDrawdown: { label: "Max Drawdown", color: () => "var(--red-600)", suffix: "%", explain: "Mayor caída desde un máximo histórico. Un drawdown de -20% significa que en el peor momento perdiste un 20% desde el pico." },
    calmar: { label: "Calmar Ratio", color: (v) => Number(v) >= 0.5 ? "var(--green-600)" : "var(--text-primary)", suffix: "", explain: "Retorno anual / Max Drawdown absoluto. Calmar > 1 es positivo." },
    cagr: { label: "CAGR", color: (v) => Number(v) >= 0 ? "var(--green-600)" : "var(--red-600)", suffix: "%", explain: "Tasa de Crecimiento Anual Compuesta. Es la métrica más representativa del rendimiento a largo plazo." },
    winRate: { label: "Win Rate", color: (v) => Number(v) >= 55 ? "var(--green-600)" : "var(--text-primary)", suffix: "%", explain: "Porcentaje de días con retorno positivo. > 55% es generalmente bueno." },
    annualReturn: { label: "Retorno anual est.", color: (v) => Number(v) >= 0 ? "var(--green-600)" : "var(--red-600)", suffix: "%", explain: "Retorno medio diario escalado a 252 días hábiles." },
    var95: { label: "VaR 95% diario", color: (v) => Number(v) > 3 ? "var(--red-600)" : "var(--text-primary)", suffix: "%", explain: "Pérdida máxima diaria esperada con 95% de probabilidad. Valores > 3% indican alta concentración de riesgo." },
    painIndex: { label: "Pain Index", color: (v) => Number(v) > 10 ? "var(--red-600)" : Number(v) > 5 ? "var(--amber-600)" : "var(--green-600)", suffix: "%", explain: "Media de todas las caídas desde máximos. < 5% es excelente, > 10% indica drawdowns frecuentes." },
    recoveryFactor: { label: "Recovery Factor", color: (v) => Number(v) >= 1 ? "var(--green-600)" : "var(--text-primary)", suffix: "", explain: "CAGR / Max Drawdown absoluto. > 1 es positivo, > 2 es excelente." },
  };

  return (
    <>
      <h1>Inicio</h1>
      <p>Sesion activa como <strong>{usuario.nombre}</strong></p>

      <section id="sec-inicio-resumen">
        <div className="listHeader"><h2>Tabla resumen</h2></div>
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
            {resumenesConMetricas.length === 0 ? (
              <tr><td colSpan="6">No hay registros de resumen</td></tr>
            ) : (
              <>
                {resumenesConAlerta.map((resumen) => (
                  <tr key={resumen.id}>
                    <td>{resumen.categoria_nombre || "-"}</td>
                    <td>{Number(resumen.totalCategoriaMoneda || 0).toFixed(2)}</td>
                    <td>{Number(resumen.inversionInicial || 0).toFixed(2)}</td>
                    <td title={resumen.tooltipRentabilidad}>{Number(resumen.rentabilidad || 0).toFixed(2)}%</td>
                    <td title={resumen.tooltipPeso}>
                      {Number(resumen.peso || 0).toFixed(2)}%{" "}
                      {resumen.needsRebalance ? (
                        <span className="rebalanceBadge" title={resumen.tooltipPeso}>⚠ Rebalancear</span>
                      ) : null}
                    </td>
                    <td>
                      <input
                        type="number" min="0" step="0.01"
                        value={getResumenPesoInputValue(resumen)}
                        disabled={savingResumenId === resumen.id}
                        onChange={(e) => handleResumenPesoDraftChange(resumen.id, e.target.value)}
                        onBlur={() => commitResumenPesoObjetivo(resumen)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                          if (e.key === "Escape") { e.preventDefault(); resetResumenPesoDraft(resumen); }
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
                    <Pie data={resumenPieData} dataKey="valor" nameKey="categoria"
                      outerRadius={112} labelLine={false} label={renderPiePercentLabel}>
                      {resumenPieData.map((entry, index) => (
                        <Cell key={`resumen-pie-${entry.categoria}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
              <button type="button"
                className={`buttonSecondary chartToggleButton${inicioPortfolioChartMode === "line" ? " chartToggleButtonActive" : ""}`}
                onClick={() => setInicioPortfolioChartMode("line")} title="Ver como líneas" aria-label="Ver como líneas">
                Línea
              </button>
              <h3>Evolución del valor total por portafolios</h3>
              <button type="button"
                className={`buttonSecondary chartToggleButton${inicioPortfolioChartMode === "bar" ? " chartToggleButtonActive" : ""}`}
                onClick={() => setInicioPortfolioChartMode("bar")} title="Ver como columnas" aria-label="Ver como columnas">
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
                      <XAxis dataKey="mes_label" /><YAxis />
                      <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)} ${monedaResumenTicker}`, "Valor"]} />
                      <Legend onClick={handleInicioPortfolioLegendClick}
                        formatter={(value, entry) => {
                          const hidden = Boolean(hiddenInicioPortfolioKeys[String(entry?.dataKey || "")]);
                          return <span style={{ opacity: hidden ? 0.45 : 1, textDecoration: hidden ? "line-through" : "none", cursor: String(entry?.dataKey || "").startsWith("pf_") ? "pointer" : "default" }}>{value}</span>;
                        }} />
                      {inicioPortfolioKeys.map((pf) => (
                        <Bar key={pf.key} dataKey={pf.key} name={pf.label} fill={pf.color}
                          stackId="pf" hide={Boolean(hiddenInicioPortfolioKeys[pf.key])} />
                      ))}
                      <Line type="monotone" dataKey="total" name="Total" stroke="#0f172a" strokeWidth={2.4} dot={false} />
                    </ComposedChart>
                  ) : (
                    <LineChart data={inicioPortfolioSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha_label" /><YAxis />
                      <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)} ${monedaResumenTicker}`, "Valor"]} />
                      <Legend onClick={handleInicioPortfolioLegendClick}
                        formatter={(value, entry) => {
                          const hidden = Boolean(hiddenInicioPortfolioKeys[String(entry?.dataKey || "")]);
                          return <span style={{ opacity: hidden ? 0.45 : 1, textDecoration: hidden ? "line-through" : "none", cursor: String(entry?.dataKey || "").startsWith("pf_") ? "pointer" : "default" }}>{value}</span>;
                        }} />
                      {inicioPortfolioKeys.map((pf) => (
                        <Line key={pf.key} type="monotone" dataKey={pf.key} name={pf.label}
                          stroke={pf.color} strokeWidth={1.8} dot={false}
                          hide={Boolean(hiddenInicioPortfolioKeys[pf.key])} />
                      ))}
                      <Line type="monotone" dataKey="total" name="Total" stroke="#0f172a" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="chartCard chartCardWide">
            <div className="chartCardHeader">
              <button type="button"
                className={`buttonSecondary chartToggleButton${inicioRentabilidadChartMode === "line" ? " chartToggleButtonActive" : ""}`}
                onClick={() => setInicioRentabilidadChartMode("line")} title="Ver como líneas" aria-label="Ver como líneas">
                Línea
              </button>
              <h3>Evolución de la rentabilidad</h3>
              <button type="button"
                className={`buttonSecondary chartToggleButton${inicioRentabilidadChartMode === "bar" ? " chartToggleButtonActive" : ""}`}
                onClick={() => setInicioRentabilidadChartMode("bar")} title="Ver como columnas" aria-label="Ver como columnas">
                Columnas
              </button>
              <button type="button"
                className={`buttonSecondary chartToggleButton${showBenchmark ? " chartToggleButtonActive" : ""}`}
                onClick={() => setShowBenchmark((prev) => !prev)} title="Comparar con benchmark">
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
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Datos vía{" "}
                  <a href="https://finance.yahoo.com" target="_blank" rel="noreferrer"
                    style={{ color: "var(--blue-600)", textDecoration: "underline" }}>Yahoo Finance</a>
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
                      <XAxis dataKey="mes_label" /><YAxis />
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
                      <XAxis dataKey="mes_label" /><YAxis />
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
          <div className="riskMetricsGrid">
            {Object.entries(RISK_INFO).map(([key, meta]) => (
              <div key={key} className="riskMetricCard" style={{ position: "relative" }}>
                <div className="riskMetricLabel" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {meta.label}
                  <button type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.75rem", padding: "0 2px", lineHeight: 1 }}
                    onClick={() => setShowRiskInfo(showRiskInfo === key ? null : key)}
                    title="Info">?</button>
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
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
            Calculado a partir de los snapshots del portafolio (retornos diarios). Se requieren al menos 4 puntos históricos.
          </p>
        </section>
      ) : null}

      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
