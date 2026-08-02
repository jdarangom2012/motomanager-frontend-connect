export function formatMoney(value?: number | string | null, currency = "COP") {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export function formatTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function estadoLabel(estado?: string | null) {
  if (!estado) return "-";
  return estado.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
