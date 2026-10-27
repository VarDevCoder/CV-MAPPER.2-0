import { CAMPOS_CV } from "../types";
import type { CampoCV, DatosCV } from "../types";

// Valida el correo con una expresión regular simple pero suficiente.
function correoValido(correo: string): boolean {
  if (correo.trim() === "") return true; // vacío no se marca como error
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

// Valida que un número sea >= 0. Acepta vacío sin marcar error.
function numeroNoNegativo(valor: string): boolean {
  if (valor.trim() === "") return true;
  const n = Number(valor);
  return !Number.isNaN(n) && n >= 0;
}

/**
 * Devuelve el mensaje de error de un campo, o "" si es válido.
 * Reglas: correo con formato válido; años y salario numéricos >= 0.
 */
export function errorDeCampo(campo: CampoCV, valor: string): string {
  if (campo === "correo" && !correoValido(valor)) {
    return "Correo con formato inválido (ej: nombre@dominio.com).";
  }
  if (
    (campo === "anosExperiencia" || campo === "salarioEsperado") &&
    !numeroNoNegativo(valor)
  ) {
    return "Debe ser un número mayor o igual a 0.";
  }
  return "";
}

// Cuenta cuántos campos del formulario tienen errores de validación.
export function contarErrores(datos: DatosCV): number {
  return CAMPOS_CV.filter((def) => errorDeCampo(def.clave, datos[def.clave]) !== "").length;
}
