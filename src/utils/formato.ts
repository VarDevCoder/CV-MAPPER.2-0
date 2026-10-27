// Utilidades de presentación (solo formato visual, no modifican datos).

// Devuelve hasta 2 iniciales de un nombre. Ej: "Ana María Giménez" -> "AG".
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (primera + ultima).toUpperCase();
}

// Separa un texto de habilidades en una lista (por coma o punto y coma).
// No se usa "/" para no partir habilidades como "CI/CD".
export function listaHabilidades(texto: string): string[] {
  return texto
    .split(/[,;]/)
    .map((h) => h.trim())
    .filter(Boolean);
}

// Formatea un número con separador de miles. Si no es número, lo deja igual.
export function formatearNumero(valor: string): string {
  if (valor.trim() === "") return "";
  const n = Number(valor);
  return Number.isNaN(n) ? valor : n.toLocaleString("es-PY");
}
