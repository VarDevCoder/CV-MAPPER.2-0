import type { CampoDinamico, Hoja, TipoCampo } from "../types";
import { esCorreoValido, esNumeroValido } from "./validacion";

/**
 * Normaliza un texto para comparar nombres y buscar:
 * minúsculas, sin acentos (NFD) y sin caracteres no alfanuméricos.
 * Ej: "Años_Exp." -> "anosexp"
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina acentos
    .replace(/[^a-z0-9]/g, ""); // deja solo letras y números
}

// Palabras que, en el nombre de una columna, sugieren un valor numérico.
const PALABRAS_NUMERO = [
  "anos",
  "anios",
  "experiencia",
  "salario",
  "sueldo",
  "monto",
  "edad",
  "precio",
  "cantidad",
  "total",
  "importe",
];

// Palabras que sugieren un correo electrónico.
const PALABRAS_EMAIL = ["mail", "correo"];

// Palabras que sugieren la columna que identifica al registro (para el título).
const PALABRAS_NOMBRE = ["nombre", "name"];
const PALABRAS_TITULO = ["titulo", "title"];

// Proporción mínima de valores que deben cumplir el tipo.
const UMBRAL = 0.8;
// Umbral más permisivo cuando el nombre de la columna ya sugiere el tipo.
const UMBRAL_CON_NOMBRE = 0.5;

function contieneAlguna(nombreNorm: string, palabras: string[]): boolean {
  return palabras.some((p) => nombreNorm.includes(p));
}

// Convierte "salario_esperado_usd" en "Salario esperado usd".
function etiquetaLegible(columna: string): string {
  const texto = columna.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (texto === "") return columna;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Decide si una columna es de cierto tipo según la proporción de valores
// que lo cumplen. Sin valores, decide solo el nombre.
function cumpleTipo(valores: string[], esDelTipo: (v: string) => boolean, nombreSugiere: boolean) {
  if (valores.length === 0) return nombreSugiere;
  const proporcion = valores.filter(esDelTipo).length / valores.length;
  return proporcion >= (nombreSugiere ? UMBRAL_CON_NOMBRE : UMBRAL);
}

/**
 * Genera la configuración inicial de campos: uno por columna de la hoja,
 * todos visibles, con el tipo inferido de los valores y del nombre.
 */
export function inferirCampos(hoja: Hoja): CampoDinamico[] {
  return hoja.encabezados.map((columna) => {
    const nombreNorm = normalizar(columna);
    const valores = hoja.filas.map((f) => (f[columna] ?? "").trim()).filter((v) => v !== "");

    const nombreEsNumero = contieneAlguna(nombreNorm, PALABRAS_NUMERO);
    const nombreEsEmail = contieneAlguna(nombreNorm, PALABRAS_EMAIL);

    let tipo: TipoCampo = "texto";
    if (cumpleTipo(valores, esCorreoValido, nombreEsEmail)) {
      tipo = "email";
    } else if (cumpleTipo(valores, esNumeroValido, nombreEsNumero)) {
      tipo = "numero";
    }

    const numeros = valores.filter(esNumeroValido).map(Number);
    const todosNoNegativos = numeros.length > 0 && numeros.every((n) => n >= 0);

    return {
      columna,
      etiqueta: etiquetaLegible(columna),
      tipo,
      visible: true,
      noNegativo: nombreEsNumero || todosNoNegativos,
    };
  });
}

/**
 * Elige la columna que da título a la vista previa del registro:
 * primero una de nombre, luego una de título y, si no hay, la primera
 * de texto visible. Devuelve null si no hay ninguna de texto visible.
 */
export function columnaTitulo(campos: CampoDinamico[]): string | null {
  const deTexto = campos.filter((c) => c.visible && c.tipo === "texto");
  const coincide = (c: CampoDinamico, palabras: string[]) =>
    contieneAlguna(normalizar(c.columna), palabras) ||
    contieneAlguna(normalizar(c.etiqueta), palabras);

  const elegido =
    deTexto.find((c) => coincide(c, PALABRAS_NOMBRE)) ??
    deTexto.find((c) => coincide(c, PALABRAS_TITULO)) ??
    deTexto[0];
  return elegido ? elegido.columna : null;
}
