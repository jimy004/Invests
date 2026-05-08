import { Fragment } from "react";
import { formatSnapshotDate, formatSnapshotTime } from "../utils/format.js";
import Pagination from "../components/Pagination.jsx";

export default function SnapshotsPage({
  portafolios, loadingSnapshots,
  snapshotPortafolioId, setSnapshotPortafolioId,
  snapshotFechaInicio, setSnapshotFechaInicio,
  snapshotFechaFin, setSnapshotFechaFin,
  portfolioSnapshots, sortedPortfolioSnapshots,
  pagedSnapshots, currentSnapshotsPage, totalSnapshotsPages, setSnapshotsPage,
  posicionSnapshotsByDateTime,
  firstPortfolioSnapshot, lastPortfolioSnapshot,
  portfolioVariacion, portfolioVariacionPct,
  expandedPortfolioSnapshotId, setExpandedPortfolioSnapshotId,
  error,
  onConsultar, onGenerarManual, onGenerarTodos, onEliminarSnapshot
}) {
  function snapshotDateKey(value) {
    return String(value || "").slice(0, 10);
  }

  function snapshotDateTimeKey(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
    const normalized = raw.replace("T", " ").replace("Z", "").slice(0, 19);
    return normalized;
  }

  return (
    <>
      <h1>Snapshots</h1>
      <section>
        <h2>Filtros</h2>
        <form className="form snapshotFiltersForm" onSubmit={onConsultar}>
          <div className="snapshotFilterField">
            <label htmlFor="snapshotPortafolio">Portafolio</label>
            <select id="snapshotPortafolio" value={snapshotPortafolioId}
              onChange={(e) => setSnapshotPortafolioId(e.target.value)} required>
              <option value="">Selecciona un portafolio</option>
              {portafolios.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="snapshotFilterField">
            <label htmlFor="snapshotFechaInicio">Fecha inicio</label>
            <input id="snapshotFechaInicio" type="date" value={snapshotFechaInicio}
              onChange={(e) => setSnapshotFechaInicio(e.target.value)} />
          </div>
          <div className="snapshotFilterField">
            <label htmlFor="snapshotFechaFin">Fecha fin</label>
            <input id="snapshotFechaFin" type="date" value={snapshotFechaFin}
              onChange={(e) => setSnapshotFechaFin(e.target.value)} />
          </div>
          <div className="actionsRow snapshotFilterActions">
            <button type="submit" disabled={loadingSnapshots || !snapshotPortafolioId}>
              {loadingSnapshots ? "Consultando..." : "Consultar snapshots"}
            </button>
            <button type="button" disabled={loadingSnapshots || !snapshotPortafolioId}
              onClick={onGenerarManual}>
              Hacer snapshot ahora
            </button>
            <button type="button" disabled={loadingSnapshots || portafolios.length === 0}
              onClick={onGenerarTodos}>
              Snapshot todos los portafolios
            </button>
            <button type="button" className="buttonSecondary"
              onClick={() => { setSnapshotFechaInicio(""); setSnapshotFechaFin(""); }}>
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
                <th>Hora</th><th>Portafolio</th><th>Valor</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedPortfolioSnapshots.length === 0 ? (
                <tr><td colSpan="4">No hay snapshots de portafolio para este filtro</td></tr>
              ) : (
                pagedSnapshots.map((snapshot, index) => {
                  const dateLabel = formatSnapshotDate(snapshot.fecha);
                  const dateKey = snapshotDateKey(snapshot.fecha);
                  const snapshotKey = snapshotDateTimeKey(snapshot.fecha);
                  const posicionesDelSnapshot = posicionSnapshotsByDateTime[snapshotKey] || [];
                  const isExpanded = expandedPortfolioSnapshotId === snapshot.id;
                  const showDateSeparator =
                    index === 0 || snapshotDateKey(pagedSnapshots[index - 1]?.fecha) !== dateKey;
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
                            onClick={(e) => { e.stopPropagation(); onEliminarSnapshot(snapshot); }}
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <img src="/buttons/delete.svg" alt="" aria-hidden="true" className="iconActionImage" />
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
                                <p className="snapshotHint">No hay snapshots de posiciones para esta snapshot.</p>
                              ) : (
                                <table className="table snapshotNestedTable">
                                  <thead>
                                    <tr>
                                      <th>Activo</th><th>Ticker</th><th>Cantidad</th><th>Valor</th><th>Portafolio</th>
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
        <Pagination currentPage={currentSnapshotsPage} totalPages={totalSnapshotsPages} onPageChange={setSnapshotsPage} />
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
