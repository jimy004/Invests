import { Fragment } from "react";
import {
  BarChart, Bar, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { formatCashFlowCategoria, formatSnapshotDate } from "../utils/format.js";
import { CASHFLOW_CATEGORIAS, CHART_COLORS, CHART_MAX_POINTS, LIST_PAGE_SIZE } from "../utils/constants.js";
import { renderDirectionBadge, renderPiePercentLabel, buildPiePercentTooltipFormatter } from "../utils/chartHelpers.jsx";
import Pagination from "../components/Pagination.jsx";

export default function CashflowPage({
  cashFlows, cashFlowResumen, loadingCashFlow,
  showCashFlowForm, setShowCashFlowForm,
  cashFlowCalendarCursor, setCashFlowCalendarCursor,
  cashFlowSelectedDate, setCashFlowSelectedDate,
  cashFlowSelectedMonthType, setCashFlowSelectedMonthType,
  editingCashFlowId,
  cashFlowTipo, setCashFlowTipo,
  cashFlowCategoria, setCashFlowCategoria,
  cashFlowMonedaId, setCashFlowMonedaId,
  cashFlowNombre, setCashFlowNombre,
  cashFlowFecha, setCashFlowFecha,
  cashFlowAporte, setCashFlowAporte,
  cashFlowObservacion, setCashFlowObservacion,
  monedas, monedaResumenTicker,
  loading, error,
  movimientosPage, setMovimientosPage,
  onSubmit, onDelete, onEdit, onClearForm
}) {
  // ── Derived calendar values ───────────────────────────────────────────────
  const currencyTicker = cashFlowResumen?.moneda_ticker || monedaResumenTicker || "";
  const calendarNow = new Date();
  const calendarYear = cashFlowCalendarCursor.getFullYear();
  const calendarMonth = cashFlowCalendarCursor.getMonth();
  const calendarMonthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" })
    .format(new Date(calendarYear, calendarMonth, 1));
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;

  function buildDateKey(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const getConverted = (cf) => {
    const v = Number(cf?.aporte_convertido);
    return Number.isFinite(v) ? v : Number(cf?.aporte || 0);
  };
  const getOriginalAmount = (cf) => Number(cf?.aporte || 0);
  const getOriginalTicker = (cf) => cf?.moneda_ticker || monedaResumenTicker || "";

  // ── Calendar signals ──────────────────────────────────────────────────────
  const daySignals = cashFlows.reduce((acc, cf) => {
    const raw = String(cf.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return acc;
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(5, 7));
    const d = Number(raw.slice(8, 10));
    if (y !== calendarYear || m !== calendarMonth + 1 || d < 1 || d > daysInMonth) return acc;
    if (!acc[d]) acc[d] = { hasIngreso: false, hasGasto: false };
    const tipo = String(cf.tipo || "").toLowerCase();
    if (tipo === "ingreso") acc[d].hasIngreso = true;
    if (tipo === "gasto") acc[d].hasGasto = true;
    return acc;
  }, {});

  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const movementsInMonth = cashFlows.filter((cf) => {
    const raw = String(cf.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
    return Number(raw.slice(0, 4)) === calendarYear && Number(raw.slice(5, 7)) === calendarMonth + 1;
  });

  // ── Monthly totals & charts ───────────────────────────────────────────────
  const monthIngresos = movementsInMonth.filter((cf) => String(cf.tipo || "").toLowerCase() === "ingreso");
  const monthGastos   = movementsInMonth.filter((cf) => String(cf.tipo || "").toLowerCase() === "gasto");

  const totalIngresos = monthIngresos.reduce((s, cf) => s + getConverted(cf), 0);
  const totalGastos   = monthGastos.reduce((s, cf) => s + getConverted(cf), 0);

  const buildCatData = (list) =>
    Object.entries(list.reduce((acc, cf) => {
      const cat = String(cf.categoria || "otros").trim().toLowerCase() || "otros";
      acc[cat] = Number(acc[cat] || 0) + getConverted(cf);
      return acc;
    }, {}))
      .map(([categoria, valor]) => ({ categoria: formatCashFlowCategoria(categoria), valor: Number(valor || 0) }))
      .sort((a, b) => b.valor - a.valor);

  const categoriasIngresos = buildCatData(monthIngresos);
  const categoriasGastos   = buildCatData(monthGastos);
  const totalCatIngresos   = categoriasIngresos.reduce((s, i) => s + Number(i?.valor || 0), 0);
  const totalCatGastos     = categoriasGastos.reduce((s, i) => s + Number(i?.valor || 0), 0);

  const mensualData = Array.from({ length: 12 }, (_, mi) => ({
    mes: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(calendarYear, mi, 1)),
    ingresos: 0, gastos: 0
  }));
  for (const cf of cashFlows) {
    const raw = String(cf.fecha || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;
    if (Number(raw.slice(0, 4)) !== calendarYear) continue;
    const m = Number(raw.slice(5, 7));
    if (!Number.isInteger(m) || m < 1 || m > 12) continue;
    const amount = getConverted(cf);
    if (String(cf.tipo || "").toLowerCase() === "ingreso") mensualData[m - 1].ingresos += amount;
    else if (String(cf.tipo || "").toLowerCase() === "gasto") mensualData[m - 1].gastos += amount;
  }

  const saldoEvolution = [];
  const dailyNet = cashFlows
    .slice()
    .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")) || Number(a.id || 0) - Number(b.id || 0))
    .reduce((acc, cf) => {
      const dk = String(cf.fecha || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dk)) return acc;
      const signed = String(cf.tipo || "").toLowerCase() === "gasto" ? -getConverted(cf) : getConverted(cf);
      acc[dk] = Number(acc[dk] || 0) + signed;
      return acc;
    }, {});
  let running = 0;
  for (const dk of Object.keys(dailyNet).sort((a, b) => a.localeCompare(b))) {
    running += Number(dailyNet[dk] || 0);
    saldoEvolution.push({ fecha: dk, saldo: running });
  }

  // ── Day/month selections ──────────────────────────────────────────────────
  const dayMovements = cashFlowSelectedDate
    ? cashFlows.filter((cf) => String(cf.fecha || "").slice(0, 10) === cashFlowSelectedDate)
    : [];
  const monthTypeMovements = cashFlowSelectedMonthType
    ? movementsInMonth.filter((cf) => String(cf.tipo || "").toLowerCase() === cashFlowSelectedMonthType)
    : [];
  const dayLabel = /^\d{4}-\d{2}-\d{2}$/.test(cashFlowSelectedDate)
    ? `${cashFlowSelectedDate.slice(8, 10)}/${cashFlowSelectedDate.slice(5, 7)}/${cashFlowSelectedDate.slice(0, 4)}`
    : cashFlowSelectedDate;

  // ── Pagination ────────────────────────────────────────────────────────────
  const sorted = cashFlows.slice().sort((a, b) => {
    const d = String(b.fecha || "").localeCompare(String(a.fecha || ""));
    return d !== 0 ? d : Number(b.id || 0) - Number(a.id || 0);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(movimientosPage, totalPages);
  const paged = sorted.slice((currentPage - 1) * LIST_PAGE_SIZE, currentPage * LIST_PAGE_SIZE);

  // ── Calendar nav ──────────────────────────────────────────────────────────
  function onMonthChange(delta) {
    setCashFlowCalendarCursor((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return d;
    });
    setCashFlowSelectedDate("");
    setCashFlowSelectedMonthType("");
  }

  function onDayClick(day) {
    const dk = buildDateKey(calendarYear, calendarMonth, day);
    setCashFlowSelectedDate((prev) => (prev === dk ? "" : dk));
    setCashFlowSelectedMonthType("");
  }

  function onMonthTypeClick(tipo) {
    setCashFlowSelectedDate("");
    setCashFlowSelectedMonthType((prev) => (prev === tipo ? "" : tipo));
  }

  return (
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
            <h3>Categorias de ingresos ({calendarMonthLabel})</h3>
            {categoriasIngresos.length === 0 ? (
              <p className="chartNoData">No hay ingresos para este mes.</p>
            ) : (
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoriasIngresos} dataKey="valor" nameKey="categoria"
                      outerRadius={88} labelLine={false} label={renderPiePercentLabel}>
                      {categoriasIngresos.map((entry, index) => (
                        <Cell key={`cf-ingreso-${entry.categoria}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={buildPiePercentTooltipFormatter(totalCatIngresos)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="chartCard">
            <h3>Categorias de gastos ({calendarMonthLabel})</h3>
            {categoriasGastos.length === 0 ? (
              <p className="chartNoData">No hay gastos para este mes.</p>
            ) : (
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoriasGastos} dataKey="valor" nameKey="categoria"
                      outerRadius={88} labelLine={false} label={renderPiePercentLabel}>
                      {categoriasGastos.map((entry, index) => (
                        <Cell key={`cf-gasto-${entry.categoria}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={buildPiePercentTooltipFormatter(totalCatGastos)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="chartCard chartCardWide">
            <h3>Ingresos y gastos mensuales ({calendarYear})</h3>
            <div className="chartWrap">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mensualData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" /><YAxis />
                  <Tooltip formatter={(v) => [`${Number(v || 0).toFixed(2)} ${currencyTicker}`, "Importe"]} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" />
                  <Bar dataKey="gastos" name="Gastos" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="chartCard chartCardWide">
            <h3>Evolucion del saldo neto</h3>
            {saldoEvolution.length === 0 ? (
              <p className="chartNoData">No hay datos para calcular el saldo neto.</p>
            ) : (
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={saldoEvolution.slice(-CHART_MAX_POINTS)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" /><YAxis />
                    <Tooltip formatter={(v) => [`${Number(v || 0).toFixed(2)} ${currencyTicker}`, "Saldo neto"]} />
                    <Legend />
                    <Line type="monotone" dataKey="saldo" name="Saldo neto acumulado"
                      stroke="#0f172a" strokeWidth={2.4} dot={false} />
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
            <p className="cashflowCalendarMonth">{calendarMonthLabel}</p>
          </div>
          <div className="cashflowCalendarNav">
            <button type="button" className="buttonSecondary cashflowCalendarNavButton"
              onClick={() => onMonthChange(-1)} aria-label="Mes anterior" title="Mes anterior">{"<"}</button>
            <button type="button" className="buttonSecondary cashflowCalendarNavButton"
              onClick={() => onMonthChange(1)} aria-label="Mes siguiente" title="Mes siguiente">{">"}</button>
          </div>
        </div>
        <div className="cashflowCalendarGrid">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} className="cashflowCalendarWeekday">{d}</div>
          ))}
          {calendarCells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="cashflowCalendarCellEmpty" />;
            const signals = daySignals[day] || { hasIngreso: false, hasGasto: false };
            const dk = buildDateKey(calendarYear, calendarMonth, day);
            const isToday = day === calendarNow.getDate() && calendarMonth === calendarNow.getMonth() && calendarYear === calendarNow.getFullYear();
            const isSelected = cashFlowSelectedDate === dk;
            return (
              <button type="button" key={`day-${day}`}
                className={`cashflowCalendarCell cashflowCalendarCellButton${isToday ? " cashflowCalendarCellToday" : ""}${isSelected ? " cashflowCalendarCellSelected" : ""}`}
                onClick={() => onDayClick(day)}>
                <span className="cashflowCalendarDayNumber">{day}</span>
                <div className="cashflowCalendarDots">
                  {signals.hasIngreso ? <span className="cashflowCalendarDot cashflowCalendarDotIngreso" /> : null}
                  {signals.hasGasto ? <span className="cashflowCalendarDot cashflowCalendarDotGasto" /> : null}
                </div>
              </button>
            );
          })}
        </div>
        <div className="cashflowCalendarLegend">
          <span className="cashflowCalendarLegendItem">
            <span className="cashflowCalendarDot cashflowCalendarDotIngreso" />Ingreso
          </span>
          <span className="cashflowCalendarLegendItem">
            <span className="cashflowCalendarDot cashflowCalendarDotGasto" />Gasto
          </span>
        </div>
        <div className="cashflowMonthTotals">
          <button type="button"
            className={`cashflowMonthTotalCard${cashFlowSelectedMonthType === "ingreso" ? " cashflowMonthTotalCardActive" : ""}`}
            onClick={() => onMonthTypeClick("ingreso")}>
            <span>Total ingresos del mes</span>
            <strong>{totalIngresos.toFixed(2)}</strong>
          </button>
          <button type="button"
            className={`cashflowMonthTotalCard${cashFlowSelectedMonthType === "gasto" ? " cashflowMonthTotalCardActive" : ""}`}
            onClick={() => onMonthTypeClick("gasto")}>
            <span>Total gastos del mes</span>
            <strong>{totalGastos.toFixed(2)}</strong>
          </button>
        </div>
        {cashFlowSelectedDate ? (
          <div className="cashflowDayDetail">
            <h3>Movimientos del {dayLabel}</h3>
            {dayMovements.length === 0 ? <p>No hay movimientos para este dia.</p> : (
              <ul className="cashflowDayList">
                {dayMovements.map((cf) => (
                  <li key={`day-${cf.id}`}>
                    <strong>{cf.tipo}</strong> - {formatCashFlowCategoria(cf.categoria)} -{" "}
                    {cf.nombre} - {getOriginalAmount(cf).toFixed(2)} {getOriginalTicker(cf)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : cashFlowSelectedMonthType ? (
          <div className="cashflowDayDetail">
            <h3>{cashFlowSelectedMonthType === "ingreso" ? "Ingresos" : "Gastos"} de {calendarMonthLabel}</h3>
            {monthTypeMovements.length === 0 ? (
              <p>No hay {cashFlowSelectedMonthType === "ingreso" ? "ingresos" : "gastos"} para este mes.</p>
            ) : (
              <ul className="cashflowDayList">
                {monthTypeMovements.map((cf) => (
                  <li key={`month-${cf.id}`}>
                    <strong>{formatCashFlowCategoria(cf.categoria)}</strong> - {cf.nombre} -{" "}
                    {String(cf.fecha || "").slice(0, 10)} - {getOriginalAmount(cf).toFixed(2)} {getOriginalTicker(cf)}
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
          <button type="button"
            className={`buttonSecondary iconToggleButton${showCashFlowForm ? " iconToggleButtonOpen" : ""}`}
            onClick={() => setShowCashFlowForm((prev) => !prev)}
            title={showCashFlowForm ? "Ocultar formulario de cashflow" : "Mostrar formulario de cashflow"}
            aria-label={showCashFlowForm ? "Ocultar formulario de cashflow" : "Mostrar formulario de cashflow"}>
            <img src="/buttons/add.svg" alt="" aria-hidden="true" className="iconToggleImage" />
          </button>
        </div>
        {showCashFlowForm ? (
          <>
            <h3 className="cashflowFormTitle">{editingCashFlowId ? "Editar movimiento" : "Crear movimiento"}</h3>
            <form onSubmit={onSubmit} className="form cashflowCompactForm">
              <div className="cashflowField cashflowFieldTipo">
                <label htmlFor="cashFlowTipo">Tipo</label>
                <select id="cashFlowTipo" value={cashFlowTipo} onChange={(e) => setCashFlowTipo(e.target.value)} required>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
              <div className="cashflowField cashflowFieldCategoria">
                <label htmlFor="cashFlowCategoria">Categoria</label>
                <select id="cashFlowCategoria" value={cashFlowCategoria} onChange={(e) => setCashFlowCategoria(e.target.value)} required>
                  {CASHFLOW_CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>{formatCashFlowCategoria(cat)}</option>
                  ))}
                </select>
              </div>
              <div className="cashflowField cashflowFieldNombre">
                <label htmlFor="cashFlowNombre">Nombre</label>
                <input id="cashFlowNombre" value={cashFlowNombre} onChange={(e) => setCashFlowNombre(e.target.value)} required />
              </div>
              <div className="cashflowField cashflowFieldFecha">
                <label htmlFor="cashFlowFecha">Fecha</label>
                <input id="cashFlowFecha" type="date" value={cashFlowFecha} onChange={(e) => setCashFlowFecha(e.target.value)} required />
              </div>
              <div className="cashflowField cashflowFieldImporte">
                <label htmlFor="cashFlowAporte">Importe</label>
                <input id="cashFlowAporte" type="number" min="0.01" step="0.01"
                  value={cashFlowAporte} onChange={(e) => setCashFlowAporte(e.target.value)} required />
              </div>
              <div className="cashflowField cashflowFieldMoneda">
                <label htmlFor="cashFlowMoneda">Moneda</label>
                <select id="cashFlowMoneda" value={cashFlowMonedaId} onChange={(e) => setCashFlowMonedaId(e.target.value)}>
                  <option value="">Moneda del usuario</option>
                  {monedas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.ticker ? `(${m.ticker})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="cashflowField cashflowFieldObservacion">
                <label htmlFor="cashFlowObservacion">Observacion</label>
                <input id="cashFlowObservacion" value={cashFlowObservacion}
                  onChange={(e) => setCashFlowObservacion(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="actionsRow cashflowFormActions">
                <button type="submit" disabled={loading}>
                  {loading ? "Procesando..." : editingCashFlowId ? "Guardar cambios" : "Crear"}
                </button>
                {editingCashFlowId ? (
                  <button type="button" className="buttonSecondary" onClick={onClearForm}>Cancelar edicion</button>
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
              <th>Categoria</th><th>Nombre</th><th>Fecha</th>
              <th>Importe</th><th>Observacion</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan="7">No hay movimientos de cashflow</td></tr>
            ) : (
              paged.map((cf, index) => {
                const dateKey = cf.fecha ? String(cf.fecha).slice(0, 10) : "";
                const prevDateKey = index > 0 && paged[index - 1]?.fecha
                  ? String(paged[index - 1].fecha).slice(0, 10) : "";
                const showSep = index === 0 || dateKey !== prevDateKey;
                return (
                  <Fragment key={cf.id}>
                    {showSep ? (
                      <tr className="snapshotDateSeparatorRow">
                        <td colSpan="7">Fecha: {dateKey ? formatSnapshotDate(dateKey) : "-"}</td>
                      </tr>
                    ) : null}
                    <tr>
                      <td>
                        {String(cf.tipo || "").toLowerCase() === "gasto"
                          ? renderDirectionBadge("left", "Gasto", "Expense")
                          : renderDirectionBadge("right", "Ingreso", "Income")}
                      </td>
                      <td>{formatCashFlowCategoria(cf.categoria)}</td>
                      <td>{cf.nombre}</td>
                      <td>{dateKey || "-"}</td>
                      <td>{getOriginalAmount(cf).toFixed(2)} {getOriginalTicker(cf)}</td>
                      <td>{cf.observacion || "-"}</td>
                      <td className="actionsCell">
                        <button type="button" className="buttonSecondary iconActionButton"
                          onClick={() => onEdit(cf)} title="Editar" aria-label="Editar">
                          <img src="/buttons/edit.svg" alt="" aria-hidden="true" className="iconActionImage" />
                        </button>
                        <button type="button" className="buttonDanger iconActionButton"
                          onClick={() => onDelete(cf.id)} title="Eliminar" aria-label="Eliminar">
                          <img src="/buttons/delete.svg" alt="" aria-hidden="true" className="iconActionImage" />
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setMovimientosPage} />
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
