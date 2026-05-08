import { formatSnapshotDate } from "./format.js";
import { CHART_COLORS, CHART_MAX_POINTS } from "./constants.js";

export function buildMonthlySeriesLastPoint(points) {
  const list = Array.isArray(points) ? points : [];
  const byMonth = new Map();
  for (const point of list) {
    const fecha = String(point?.fecha || "").trim();
    const match = fecha.match(/^(\d{4}-\d{2})/);
    if (!match) continue;
    const monthKey = match[1];
    const existing = byMonth.get(monthKey);
    if (!existing || String(point?.fecha || "") > String(existing?.fecha || "")) {
      byMonth.set(monthKey, point);
    }
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, point]) => ({
      ...point,
      mes: monthKey,
      mes_label: `${monthKey.slice(5, 7)}/${monthKey.slice(0, 4)}`
    }));
}

export function buildPosicionesEvolution(snapshotRows, totalRows = []) {
  const normalizeDateTimeKey = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw} 00:00:00`;
    return raw.replace("T", " ").replace("Z", "").slice(0, 19);
  };
  const list = Array.isArray(snapshotRows) ? snapshotRows : [];
  const totalsList = Array.isArray(totalRows) ? totalRows : [];
  if (!list.length && !totalsList.length) return { keys: [], points: [] };

  const keyMap = new Map();
  const valuesByTimestamp = new Map();
  const totalsByTimestamp = new Map();

  for (const row of totalsList) {
    const key = normalizeDateTimeKey(row?.fecha);
    if (!key) continue;
    totalsByTimestamp.set(key, Number(row?.valor || 0));
    if (!valuesByTimestamp.has(key)) valuesByTimestamp.set(key, new Map());
  }

  for (const row of list) {
    const fecha = normalizeDateTimeKey(row?.fecha);
    if (!fecha) continue;
    const posicionId = Number(row?.posicion_id || 0);
    const key = posicionId > 0 ? `pos_${posicionId}` : `pos_${String(row?.activo_nombre || "sin_nombre")}`;
    if (!keyMap.has(key)) {
      const label = `${row?.activo_nombre || "Posicion"}${row?.ticker ? ` (${row.ticker})` : ""}`;
      keyMap.set(key, { key, label });
    }
    if (!valuesByTimestamp.has(fecha)) valuesByTimestamp.set(fecha, new Map());
    valuesByTimestamp.get(fecha).set(key, Number.isFinite(Number(row?.valor)) ? Number(row.valor) : 0);
  }

  const orderedTimestamps = Array.from(valuesByTimestamp.keys()).sort((a, b) => a.localeCompare(b));
  const points = [];
  for (const timestamp of orderedTimestamps) {
    const valuesAtTimestamp = valuesByTimestamp.get(timestamp) || new Map();
    const point = { fecha: timestamp, fecha_label: formatSnapshotDate(timestamp) };
    let total = 0;
    for (const key of keyMap.keys()) {
      const value = Number(valuesAtTimestamp.get(key) || 0);
      point[key] = value;
      total += value;
    }
    if (totalsByTimestamp.has(timestamp)) total = Number(totalsByTimestamp.get(timestamp) || 0);
    point.total = total;
    points.push(point);
  }

  const finalPoint = points[points.length - 1] || {};
  const keys = Array.from(keyMap.values())
    .sort((a, b) => Number(finalPoint[b.key] || 0) - Number(finalPoint[a.key] || 0))
    .map((item, index) => ({ ...item, color: CHART_COLORS[index % CHART_COLORS.length] }));

  return { keys, points: points.slice(-CHART_MAX_POINTS) };
}

export function buildRentabilidadSeries(snapshotRows) {
  const ordered = (Array.isArray(snapshotRows) ? snapshotRows : [])
    .map((row) => ({ fecha: String(row?.fecha || ""), valor: Number(row?.valor || 0) }))
    .filter((row) => row.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!ordered.length) return [];
  const baseline = Number(ordered[0]?.valor || 0);
  return ordered.slice(-CHART_MAX_POINTS).map((point) => ({
    fecha: point.fecha,
    fecha_label: formatSnapshotDate(point.fecha),
    rentabilidad: baseline !== 0 ? ((Number(point.valor || 0) - baseline) / baseline) * 100 : 0
  }));
}
