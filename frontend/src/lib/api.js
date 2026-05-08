const API_URL = "/api";
let refreshInFlight = null;

function getAuthHeaders() {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export function clearAuthStorage(notify = true) {
  localStorage.removeItem("usuario");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  if (notify) {
    window.dispatchEvent(new Event("auth:expired"));
  }
}

async function refreshAccessToken() {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`${API_URL}/usuarios/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token })
  });

  if (!res.ok) {
    throw new Error("Refresh failed");
  }

  const data = await res.json();
  localStorage.setItem("auth_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }
}

async function request(path, options = {}, retry = true) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    ...options
  });

  if (
    retry &&
    res.status === 401 &&
    path !== "/usuarios/login" &&
    path !== "/usuarios/refresh" &&
    path !== "/usuarios/logout"
  ) {
    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      await refreshInFlight;
      return request(path, options, false);
    } catch {
      clearAuthStorage();
      throw new Error("Sesion expirada. Inicia sesion nuevamente.");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

export function getHealth() {
  return request("/health");
}

export function getDetallesAccion() {
  return request("/detallesaccion");
}

export function getDetallesAccionByActivo(activoId) {
  return request(`/detallesaccion/activo/${activoId}`);
}

export function getDetallesFondoByActivo(activoId) {
  return request(`/detallesfondo/activo/${activoId}`);
}

export function loginUsuario(payload) {
  return request("/usuarios/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function crearUsuario(payload) {
  return request("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarUsuario(id, payload) {
  return request(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function cambiarPassword(id, payload) {
  return request(`/usuarios/${id}/password`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function logoutUsuario() {
  const refresh_token = localStorage.getItem("refresh_token");
  if (refresh_token) {
    try {
      await fetch(`${API_URL}/usuarios/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token })
      });
    } catch {
      // no-op
    }
  }
  clearAuthStorage(false);
}

export function getPortafoliosByUsuario(usuarioId) {
  return request(`/portafolios/usuario/${usuarioId}`);
}

export function getResumenesByUsuario(usuarioId) {
  return request(`/resumenes/usuario/${usuarioId}`);
}

export function crearResumen(payload) {
  return request("/resumenes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarResumen(id, payload) {
  return request(`/resumenes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function actualizarResumenPeso(id, pesoObjetivo) {
  return request(`/resumenes/${id}/peso`, {
    method: "PATCH",
    body: JSON.stringify({ pesoObjetivo })
  });
}

export function eliminarResumen(id) {
  return request(`/resumenes/${id}`, {
    method: "DELETE"
  });
}

export function crearPortafolio(payload) {
  return request("/portafolios", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarPortafolio(id, payload) {
  return request(`/portafolios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarPortafolio(id) {
  return request(`/portafolios/${id}`, {
    method: "DELETE"
  });
}

export function getMonedas() {
  return request("/monedas");
}

export function getCategorias() {
  return request("/categorias");
}

export function getActivos(options = {}) {
  const params = new URLSearchParams();
  if (options.includeMarketData) {
    params.set("include_market_data", "true");
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request(`/activos${suffix}`);
}

export function importarActivoDesdeYahoo(payload) {
  return request("/activos/import-yahoo", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function recategorizarActivos() {
  return request("/activos/recategorizar", {
    method: "POST"
  });
}

export function eliminarActivo(id) {
  return request(`/activos/${id}`, {
    method: "DELETE"
  });
}

export function getPosicionesByPortafolio(portafolioId) {
  return request(`/posiciones/portafolio/${portafolioId}?include_market_data=true`);
}

export function getResumenPosicionesPortafolio(portafolioId) {
  return request(`/posiciones/portafolio/${portafolioId}/resumen`);
}

export function crearPosicion(payload) {
  return request("/posiciones", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarPosicion(id, payload) {
  return request(`/posiciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarPosicion(id) {
  return request(`/posiciones/${id}`, {
    method: "DELETE"
  });
}

export function getOrdenesByPortafolio(portafolioId) {
  return request(`/ordenes/portafolio/${portafolioId}`);
}

export function ejecutarOrdenCompra(payload) {
  return request("/ordenes/ejecutar-compra", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function ejecutarOrdenVenta(payload) {
  return request("/ordenes/ejecutar-venta", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarOrden(id, payload) {
  return request(`/ordenes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarOrden(id) {
  return request(`/ordenes/${id}`, {
    method: "DELETE"
  });
}

export function getCashFlowsByUsuario(usuarioId) {
  return request(`/cashflow/usuario/${usuarioId}`);
}

export function getResumenCashFlowUsuario(usuarioId) {
  return request(`/cashflow/usuario/${usuarioId}/resumen`);
}

export function crearCashFlow(payload) {
  return request("/cashflow", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function actualizarCashFlow(id, payload) {
  return request(`/cashflow/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function eliminarCashFlow(id) {
  return request(`/cashflow/${id}`, {
    method: "DELETE"
  });
}

export function getPortfolioSnapshotsByPortafolio(portafolioId) {
  return request(`/portfoliosnapshots/portafolio/${portafolioId}`);
}

export function eliminarPortfolioSnapshot(id) {
  return request(`/portfoliosnapshots/${id}`, {
    method: "DELETE"
  });
}

export function getPortfolioSnapshotsByPortafolioPeriodo(portafolioId, fechaInicio, fechaFin) {
  const params = new URLSearchParams({
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin
  });
  return request(`/portfoliosnapshots/portafolio/${portafolioId}/periodo?${params.toString()}`);
}

export function getPosicionSnapshotsByPortafolio(portafolioId) {
  return request(`/posicionsnapshots/portafolio/${portafolioId}`);
}

export function generarSnapshotPortafolio(portafolioId, fecha = null) {
  const params = new URLSearchParams();
  if (fecha) params.set("fecha", fecha);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request(`/portfoliosnapshots/generar/${portafolioId}${suffix}`, {
    method: "POST"
  });
}

export function generarSnapshotsTodosPortafolios(fecha = null) {
  const params = new URLSearchParams();
  if (fecha) params.set("fecha", fecha);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request(`/portfoliosnapshots/generar-todos${suffix}`, {
    method: "POST"
  });
}

export function generarSnapshotsPosicionesPortafolio(portafolioId, fecha = null) {
  const params = new URLSearchParams();
  if (fecha) params.set("fecha", fecha);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request(`/posicionsnapshots/generar-portafolio/${portafolioId}${suffix}`, {
    method: "POST"
  });
}

export function getSnapshotConfigByUsuario(usuarioId) {
  return request(`/snapshot-config/usuario/${usuarioId}`);
}

export function updateSnapshotConfigByUsuario(usuarioId, payload) {
  return request(`/snapshot-config/usuario/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getNotificacionesByUsuario(usuarioId, { onlyUnread = false, limit = 50 } = {}) {
  const params = new URLSearchParams({
    only_unread: onlyUnread ? "1" : "0",
    limit: String(limit)
  });
  return request(`/notificaciones/usuario/${usuarioId}?${params.toString()}`);
}

export function getNotificacionesUnreadCount(usuarioId) {
  return request(`/notificaciones/usuario/${usuarioId}/unread-count`);
}

export function markAllNotificacionesRead(usuarioId) {
  return request(`/notificaciones/usuario/${usuarioId}/mark-all-read`, {
    method: "PUT"
  });
}

export function markNotificacionRead(id) {
  return request(`/notificaciones/${id}/read`, {
    method: "PUT"
  });
}

export function eliminarTodasNotificacionesUsuario(usuarioId) {
  return request(`/notificaciones/usuario/${usuarioId}`, {
    method: "DELETE"
  });
}

export function getNoticiasYahoo() {
  return request("/noticias/yahoo");
}

// ─── Precio Alertas ───────────────────────────────────────────────────────────
export function getPrecioAlertasByUsuario(usuarioId) {
  return request(`/alertas-precio/usuario/${usuarioId}`);
}
export function crearPrecioAlerta(payload) {
  return request("/alertas-precio", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarPrecioAlerta(id, payload) {
  return request(`/alertas-precio/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function eliminarPrecioAlerta(id) {
  return request(`/alertas-precio/${id}`, { method: "DELETE" });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────
export function getWatchlistByUsuario(usuarioId) {
  return request(`/watchlist/usuario/${usuarioId}`);
}
export function crearWatchlistItem(payload) {
  return request("/watchlist", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarWatchlistNota(id, nota) {
  return request(`/watchlist/${id}/nota`, { method: "PATCH", body: JSON.stringify({ nota }) });
}
export function eliminarWatchlistItem(id) {
  return request(`/watchlist/${id}`, { method: "DELETE" });
}

// ─── Objetivos Financieros ───────────────────────────────────────────────────
export function getObjetivosByUsuario(usuarioId) {
  return request(`/objetivos/usuario/${usuarioId}`);
}
export function crearObjetivo(payload) {
  return request("/objetivos", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarObjetivo(id, payload) {
  return request(`/objetivos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function eliminarObjetivo(id) {
  return request(`/objetivos/${id}`, { method: "DELETE" });
}

// ─── Dividendos ───────────────────────────────────────────────────────────────
export function getDividendosByPortafolio(portafolioId) {
  return request(`/dividendos/portafolio/${portafolioId}`);
}
export function getDividendosByUsuario(usuarioId) {
  return request(`/dividendos/usuario/${usuarioId}`);
}
export function crearDividendo(payload) {
  return request("/dividendos", { method: "POST", body: JSON.stringify(payload) });
}
export function actualizarDividendo(id, payload) {
  return request(`/dividendos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}
export function eliminarDividendo(id) {
  return request(`/dividendos/${id}`, { method: "DELETE" });
}

// ─── Benchmark ────────────────────────────────────────────────────────────────
export function getBenchmarkHistorico(symbol, periodo) {
  const params = new URLSearchParams({ symbol, periodo });
  return request(`/benchmark/historico?${params.toString()}`);
}
export function getBenchmarkLista() {
  return request("/benchmark/lista");
}

// ─── Nota en posición ────────────────────────────────────────────────────────
export function actualizarPosicionNota(id, nota) {
  return request(`/posiciones/${id}/nota`, { method: "PATCH", body: JSON.stringify({ nota }) });
}
