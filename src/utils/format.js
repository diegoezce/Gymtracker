export const fmt = (n) => {
  if (n == null || !isFinite(n)) return String(n ?? 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
};

export const hoy = () => new Date().toISOString().slice(0, 10);

export const fechaCorta = (iso) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export const diasDesdeStr = (iso) => {
  // Parsear como medianoche local para que el conteo sea por días calendario
  // locales, no por diferencia UTC (que puede correr un día en UTC-3).
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const ahora = new Date();
  const hoyMidnight = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const diff = Math.round((hoyMidnight - fecha) / 86400000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
};
