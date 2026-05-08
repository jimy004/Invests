import { Fragment } from "react";
import { formatSnapshotDate } from "../utils/format.js";
import { SNAPSHOT_INTERVAL_OPTIONS } from "../utils/constants.js";
import Pagination from "../components/Pagination.jsx";

export default function SettingsPage({
  usuario, loading, error,
  pwNuevo, setPwNuevo, pwConfirmar, setPwConfirmar,
  showPwNuevo, setShowPwNuevo, showPwConfirmar, setShowPwConfirmar, pwMessage,
  darkMode, setDarkMode,
  settingsMonedaId, setSettingsMonedaId, monedas,
  snapshotConfigEnabled, setSnapshotConfigEnabled,
  snapshotIntervalPortafolio, setSnapshotIntervalPortafolio, setSnapshotIntervalPosicion,
  loadingNotificaciones, unreadNotificaciones,
  sortedNotificaciones, pagedNotificaciones,
  currentNotificacionesPage, totalNotificacionesPages, setNotificacionesPage,
  onCambiarPassword, onSaveMoneda, onSaveSnapshot,
  onMarkAllRead, onMarkRead, onDismissAll, onLogout
}) {
  return (
    <>
      <div className="listHeader">
        <h1>Ajustes de usuario</h1>
        <button type="button" className="buttonDanger" onClick={onLogout}>
          Cerrar sesion
        </button>
      </div>
      <p><strong>Nombre:</strong> {usuario.nombre}</p>

      <section>
        <h2>Cambiar contraseña</h2>
        <form onSubmit={onCambiarPassword}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="pwNuevo">Nueva contraseña</label>
              <div style={{ display: "flex", gap: 4 }}>
                <input id="pwNuevo" type={showPwNuevo ? "text" : "password"}
                  value={pwNuevo} onChange={(e) => setPwNuevo(e.target.value)} required />
                <button type="button" className="buttonSecondary"
                  style={{ minWidth: 38, padding: "0 8px" }}
                  onClick={() => setShowPwNuevo((v) => !v)}
                  title={showPwNuevo ? "Ocultar" : "Mostrar"}>
                  {showPwNuevo ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label htmlFor="pwConfirmar">Confirmar</label>
              <div style={{ display: "flex", gap: 4 }}>
                <input id="pwConfirmar" type={showPwConfirmar ? "text" : "password"}
                  value={pwConfirmar} onChange={(e) => setPwConfirmar(e.target.value)} required />
                <button type="button" className="buttonSecondary"
                  style={{ minWidth: 38, padding: "0 8px" }}
                  onClick={() => setShowPwConfirmar((v) => !v)}
                  title={showPwConfirmar ? "Ocultar" : "Mostrar"}>
                  {showPwConfirmar ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <button type="submit" className="buttonPrimary" disabled={loading}>Guardar</button>
          </div>
          {pwMessage ? (
            <p style={{ color: pwMessage.includes("actualizada") ? "var(--color-success, green)" : "var(--color-danger, red)", margin: "8px 0 0" }}>
              {pwMessage}
            </p>
          ) : null}
        </form>
      </section>

      <section>
        <h2>Apariencia</h2>
        <div className="actionsRow" style={{ alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.88rem" }}>Modo oscuro</span>
          <button type="button"
            className={`buttonSecondary${darkMode ? " headerButtonActive" : ""}`}
            style={{ minWidth: 80 }}
            onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "☀ Claro" : "☾ Oscuro"}
          </button>
        </div>
      </section>

      <div className="settingsInlineRow">
        <div className="settingsInlineField">
          <label htmlFor="userMoneda">Moneda del usuario</label>
          <select id="userMoneda" value={settingsMonedaId}
            onChange={async (e) => {
              const value = e.target.value;
              setSettingsMonedaId(value);
              await onSaveMoneda(value);
            }}
            disabled={loading}>
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
        <select id="snapshotEnabled" value={snapshotConfigEnabled ? "1" : "0"}
          onChange={async (e) => {
            const enabled = e.target.value === "1";
            setSnapshotConfigEnabled(enabled);
            await onSaveSnapshot({ enabled, interval: snapshotIntervalPortafolio });
          }}
          disabled={loading}>
          <option value="1">Si</option>
          <option value="0">No</option>
        </select>
        <label htmlFor="snapshotIntervalUnified">Intervalo snapshots (portafolios y posiciones)</label>
        <select id="snapshotIntervalUnified" value={snapshotIntervalPortafolio}
          onChange={async (e) => {
            const value = e.target.value;
            setSnapshotIntervalPortafolio(value);
            setSnapshotIntervalPosicion(value);
            await onSaveSnapshot({ enabled: snapshotConfigEnabled, interval: value });
          }}
          disabled={loading}>
          {SNAPSHOT_INTERVAL_OPTIONS.map((option, index) => (
            <option key={`${option.value}-${option.label}-${index}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <div className="listHeader"><h2>Notificaciones</h2></div>
        <div className="actionsRow">
          <button type="button" className="buttonSecondary"
            onClick={onMarkAllRead}
            disabled={loading || unreadNotificaciones === 0}>
            Marcar todas como leidas
          </button>
          <button type="button" className="buttonSecondary"
            onClick={onDismissAll}
            disabled={loading || sortedNotificaciones.length === 0}>
            Descartar todas
          </button>
        </div>
        {loadingNotificaciones ? <p>Cargando notificaciones...</p> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Tipo</th><th>Mensaje</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedNotificaciones.length === 0 ? (
              <tr><td colSpan="5">No hay notificaciones</td></tr>
            ) : (
              pagedNotificaciones.map((n, index) => {
                const dateKey = n.created_at ? String(n.created_at).slice(0, 10) : "";
                const prevDateKey = index > 0 && pagedNotificaciones[index - 1]?.created_at
                  ? String(pagedNotificaciones[index - 1].created_at).slice(0, 10) : "";
                const showSep = index === 0 || dateKey !== prevDateKey;
                return (
                  <Fragment key={n.id}>
                    {showSep ? (
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
                        {Number(n.leida) === 1 ? <span>-</span> : (
                          <button type="button" onClick={() => onMarkRead(n.id)}>Marcar leida</button>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentNotificacionesPage}
          totalPages={totalNotificacionesPages}
          onPageChange={setNotificacionesPage}
        />
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
