import { PIE_LABEL_MIN_PERCENT } from "./constants.js";

export function renderDirectionBadge(direction, label, tone = "default") {
  return (
    <span className={`directionBadge directionBadge${tone}`} title={label} aria-label={label}>
      {direction === "left" ? "←" : "→"}
    </span>
  );
}

export function renderPiePercentLabel({ percent }) {
  const pct = Number(percent || 0) * 100;
  if (!Number.isFinite(pct) || pct < PIE_LABEL_MIN_PERCENT * 100) return "";
  return `${pct.toFixed(0)}%`;
}

export function buildPiePercentTooltipFormatter(total, label = "Peso") {
  return (value) => {
    const numeric = Number(value || 0);
    const pct = total ? (numeric / total) * 100 : 0;
    return [`${pct.toFixed(2)}%`, label];
  };
}
