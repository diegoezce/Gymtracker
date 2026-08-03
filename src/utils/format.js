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
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
};
