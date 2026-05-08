export function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(4) : "-";
}

export function formatPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : "-";
}

export function formatPriceOrDashZero(value) {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n.toFixed(4) : "-";
}

export function formatLargeNumberOrDashZero(value) {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n.toLocaleString("es-ES") : "-";
}

export function formatPercentOrDashZero(value) {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? `${n.toFixed(2)}%` : "-";
}

export function formatCashFlowCategoria(value) {
  const s = String(value || "").trim();
  if (!s) return "Otros";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatSnapshotDate(value) {
  if (!value) return "-";
  const raw = String(value).trim();
  const match = raw.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw.slice(0, 10) || "-";
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

export function formatSnapshotTime(value) {
  if (!value) return "-";
  const raw = String(value).trim();
  if (!/\d{2}:\d{2}/.test(raw)) return "-";
  const hasZone = /Z$/i.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw);
  if (hasZone || raw.includes("T")) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
    }
  }
  const match = raw.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  if (!match) return "-";
  return match[1].length === 5 ? `${match[1]}:00` : match[1];
}

export function formatNewsDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
}
