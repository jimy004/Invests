export default function WatchlistPage({
  watchlist, loadingWatchlist, showWatchlistForm, watchlistActivoTicker,
  setWatchlistActivoTicker, watchlistNota, setWatchlistNota,
  setShowWatchlistForm,
  precioAlertas, loadingAlertas, showAlertaForm, setShowAlertaForm,
  alertaActivoId, setAlertaActivoId, alertaTipo, setAlertaTipo,
  alertaPrecio, setAlertaPrecio,
  activos, loading, error,
  onCrearWatchlist, onEliminarWatchlist, onCrearAlerta, onEliminarAlerta
}) {
  return (
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
                  onClick={onCrearWatchlist}>
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
                      onClick={() => onEliminarWatchlist(item.id)}>✕</button>
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
          <form onSubmit={onCrearAlerta} className="form" style={{ maxWidth: 420, marginBottom: 16 }}>
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
                      onClick={() => onEliminarAlerta(alerta.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
