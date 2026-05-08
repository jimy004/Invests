import { formatSnapshotDate } from "../utils/format.js";

export default function ObjetivosPage({
  objetivos, loadingObjetivos, showForm, editingId,
  nombre, setNombre, montoObjetivo, setMontoObjetivo,
  fechaObjetivo, setFechaObjetivo, montoInicial, setMontoInicial,
  nota, setNota, portafolioIds, setPortafolioIds,
  portafolios, resumenes, totalPortafolioValor, monedaTicker,
  loading, error,
  onSubmit, onEliminar, onNuevo, onEditar
}) {
  return (
    <>
      <h1>Objetivos financieros</h1>
      <section>
        <div className="listHeader">
          <h2>Mis objetivos</h2>
          <button type="button" className="buttonSecondary" onClick={onNuevo}>
            {showForm ? "Cancelar" : "+ Nuevo objetivo"}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={onSubmit} className="form" style={{ maxWidth: 480, marginBottom: 16 }}>
            <div className="formField">
              <label>Nombre del objetivo</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Fondo de emergencia, FIRE, Casa..." required />
            </div>
            <div className="formField">
              <label>Importe objetivo ({monedaTicker})</label>
              <input type="number" min="0" step="0.01" value={montoObjetivo}
                onChange={(e) => setMontoObjetivo(e.target.value)} placeholder="200000" required />
            </div>
            <div className="formField">
              <label>Fecha objetivo</label>
              <input type="date" value={fechaObjetivo}
                onChange={(e) => setFechaObjetivo(e.target.value)} required />
            </div>
            <div className="formField">
              <label>Capital inicial ({monedaTicker})</label>
              <input type="number" min="0" step="0.01" value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)} placeholder="0" />
            </div>
            <div className="formField">
              <label>Portafolios objetivo</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={portafolioIds.length === 0}
                    onChange={() => setPortafolioIds([])} />
                  Total (todos los portafolios)
                </label>
                {portafolios.map((pf) => (
                  <label key={pf.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={portafolioIds.includes(pf.id)}
                      onChange={(e) => {
                        if (e.target.checked) setPortafolioIds((prev) => [...prev, pf.id]);
                        else setPortafolioIds((prev) => prev.filter((id) => id !== pf.id));
                      }} />
                    {pf.nombre}
                  </label>
                ))}
              </div>
            </div>
            <div className="formField">
              <label>Nota (opcional)</label>
              <textarea className="notaTextarea" value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Descripcion o motivacion del objetivo..." />
            </div>
            <div className="actionsRow">
              <button type="submit" className="buttonPrimary" disabled={loading}>
                {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear objetivo"}
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
              const objPfIds = (() => {
                try { return obj.portafolio_ids ? JSON.parse(obj.portafolio_ids) : []; } catch { return []; }
              })();
              const actual = objPfIds.length > 0
                ? resumenes.filter((r) => objPfIds.includes(r.portafolio_id || r.id)).reduce((s, r) => s + Number(r.totalCategoriaMoneda || 0), 0)
                : totalPortafolioValor;
              const progreso = meta > 0 ? Math.min((actual / meta) * 100, 100) : 0;
              const fechaObj = new Date(obj.fecha_objetivo);
              const diasRestantes = Math.ceil((fechaObj - new Date()) / (1000 * 60 * 60 * 24));
              const ahorroMensualNecesario = diasRestantes > 0 && meta > actual
                ? ((meta - actual) / (diasRestantes / 30)).toFixed(2) : 0;

              return (
                <div key={obj.id} className="objetivoCard">
                  <div className="objetivoCardNombre">{obj.nombre}</div>
                  <div className="objetivoCardMeta">
                    Meta: <strong>{meta.toFixed(2)} {monedaTicker}</strong> · {formatSnapshotDate(obj.fecha_objetivo)}
                  </div>
                  {objPfIds.length > 0 ? (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      Portafolios: {portafolios.filter((p) => objPfIds.includes(p.id)).map((p) => p.nombre).join(", ") || "—"}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>Portafolios: Todos</div>
                  )}
                  <div className="objetivoProgressBar">
                    <div className="objetivoProgressFill" style={{
                      width: `${progreso}%`,
                      background: progreso >= 100 ? "var(--green-600)" : "var(--blue-500)"
                    }} />
                  </div>
                  <div className="objetivoProgressPct">
                    {progreso.toFixed(1)}% completado · {actual.toFixed(0)} / {meta.toFixed(0)} {monedaTicker}
                  </div>
                  {diasRestantes > 0 ? (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      {diasRestantes} días restantes · Ahorro mensual necesario: <strong>{ahorroMensualNecesario} {monedaTicker}</strong>
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
                      onClick={() => onEditar(obj)}>Editar</button>
                    <button type="button" className="buttonDanger"
                      style={{ fontSize: "0.75rem", padding: "3px 10px" }}
                      onClick={() => onEliminar(obj.id)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
