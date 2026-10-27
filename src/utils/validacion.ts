import type { CampoDinamico, Registro } from "../types";

// Indica si un texto es un número válido (acepta enteros, decimales con
// punto y signo). Un texto vacío NO es número.
export function esNumeroValido(valor: string): boolean {
  const limpio = valor.trim();
  if (limpio === "") return false;
  return Number.isFinite(Number(limpio));
}

// Valida el correo con una expresión regular simple pero suficiente.
export function esCorreoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

/**
 * Devuelve el mensaje de error de un campo, o "" si es válido.
 * Reglas genéricas según el tipo del campo:
 * - email: formato válido.
 * - numero: número válido y, si noNegativo está activo, >= 0.
 * Un valor vacío nunca se marca como error.
 */
export function errorDeCampo(campo: CampoDinamico, valor: string): string {
  if (valor.trim() === "") return "";
  if (campo.tipo === "email" && !esCorreoValido(valor)) {
    return "Correo con formato inválido (ej: nombre@dominio.com).";
  }
  if (campo.tipo === "numero") {
    if (!esNumeroValido(valor)) return "Debe ser un número (use punto para decimales).";
    if (campo.noNegativo && Number(valor) < 0) return "Debe ser un número mayor o igual a 0.";
  }
  return "";
}

// Cuenta cuántos campos visibles del registro tienen errores de validación.
export function contarErrores(camposVisibles: CampoDinamico[], registro: Registro): number {
  return camposVisibles.filter((c) => errorDeCampo(c, registro[c.columna] ?? "") !== "").length;
}
