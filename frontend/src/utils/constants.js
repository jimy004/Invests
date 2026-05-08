export const LIST_PAGE_SIZE = 10;
export const CHART_MAX_POINTS = 180;
export const PIE_MAX_SLICES = 7;
export const PIE_LABEL_MIN_PERCENT = 0.04;
export const VAR_95_ZSCORE = 1.645;
export const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export const CHART_COLORS = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#e11d48",
  "#0f766e",
  "#d97706",
  "#7c3aed",
  "#0369a1",
  "#ca8a04",
  "#334155"
];

export const SNAPSHOT_INTERVAL_OPTIONS = [
  { value: "60",     label: "Cada hora" },
  { value: "480",    label: "Cada 8 horas" },
  { value: "1440",   label: "Cada 24 horas" },
  { value: "10080",  label: "Cada semana" },
  { value: "43200",  label: "Cada mes" },
  { value: "129600", label: "Cada 3 meses" },
  { value: "259200", label: "Cada 6 meses" },
  { value: "525600", label: "Cada año" }
];

export const CASHFLOW_CATEGORIAS = [
  "restaurantes", "super e hipers", "bizum",
  "electronica y electrodomesticos", "transporte", "gasolina",
  "vivienda", "alquiler o hipoteca", "suministros",
  "internet y telefono", "salud y farmacia", "seguros",
  "educacion", "ropa y calzado", "ocio y suscripciones",
  "viajes", "mascotas", "regalos", "impuestos y tasas",
  "nomina", "ahorro e inversion", "transferencias", "otros"
].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
