import { CAMPOS_CV, MAPEO_VACIO, CV_VACIO } from "../types";
import type { Mapeo, CampoCV, DatosCV, FilaArchivo } from "../types";

/**
 * Normaliza un texto para comparar nombres de columnas:
 * minúsculas, sin acentos y sin caracteres no alfanuméricos.
 * Ej: "Años_Exp." -> "anosexp"
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina acentos
    .replace(/[^a-z0-9]/g, ""); // deja solo letras y números
}

// Palabras clave asociadas a cada campo del CV para la autosugerencia.
// Se comparan (normalizadas) contra el nombre de cada columna del archivo.
const PALABRAS_CLAVE: Record<CampoCV, string[]> = {
  nombreCompleto: ["nombre", "nombrecompleto", "fullname", "name", "candidato"],
  tituloProfesional: ["titulo", "puesto", "cargo", "profesion", "rol", "position", "title"],
  anosExperiencia: ["anos", "anios", "experiencia", "exp", "years", "antiguedad"],
  habilidades: ["habilidades", "skills", "competencias", "tecnologias", "stack"],
  correo: ["correo", "email", "mail", "ecorreo"],
  salarioEsperado: ["salario", "sueldo", "remuneracion", "pretension", "salary", "monto", "pretendido"],
};

/**
 * Calcula un puntaje de coincidencia entre una columna y un campo.
 * Mayor puntaje = mejor candidata para ese campo.
 */
function puntaje(columnaNorm: string, campo: CampoCV): number {
  let mejor = 0;
  for (const clave of PALABRAS_CLAVE[campo]) {
    if (columnaNorm === clave) {
      mejor = Math.max(mejor, 100); // coincidencia exacta
    } else if (columnaNorm.includes(clave) || clave.includes(columnaNorm)) {
      // coincidencia parcial: puntaje proporcional al largo de la clave
      mejor = Math.max(mejor, 50 + clave.length);
    }
  }
  return mejor;
}

/**
 * Autosugiere un mapeo campo del CV -> columna del archivo por similitud
 * de nombre. Evita asignar la misma columna a dos campos: elige primero
 * las coincidencias más fuertes.
 */
export function autosugerirMapeo(encabezados: string[]): Mapeo {
  const mapeo: Mapeo = { ...MAPEO_VACIO };
  const columnasUsadas = new Set<string>();

  // Generamos todas las combinaciones (campo, columna) con puntaje > 0.
  const candidatos: { campo: CampoCV; columna: string; p: number }[] = [];
  for (const def of CAMPOS_CV) {
    for (const columna of encabezados) {
      const p = puntaje(normalizar(columna), def.clave);
      if (p > 0) candidatos.push({ campo: def.clave, columna, p });
    }
  }

  // Ordenamos de mayor a menor puntaje y asignamos sin repetir columnas.
  candidatos.sort((a, b) => b.p - a.p);
  for (const c of candidatos) {
    if (mapeo[c.campo]) continue; // ese campo ya tiene columna
    if (columnasUsadas.has(c.columna)) continue; // esa columna ya se usó
    mapeo[c.campo] = c.columna;
    columnasUsadas.add(c.columna);
  }

  return mapeo;
}

/**
 * Indica si el mapeo está completo: todos los campos tienen una columna.
 */
export function mapeoCompleto(mapeo: Mapeo): boolean {
  return CAMPOS_CV.every((def) => mapeo[def.clave] !== "");
}

/**
 * Devuelve las columnas asignadas a más de un campo del CV.
 * Se usa para avisar al usuario y bloquear la confirmación.
 */
export function columnasDuplicadas(mapeo: Mapeo): Set<string> {
  const usos = new Map<string, number>();
  for (const def of CAMPOS_CV) {
    const col = mapeo[def.clave];
    if (col) usos.set(col, (usos.get(col) ?? 0) + 1);
  }
  const duplicadas = new Set<string>();
  usos.forEach((n, col) => {
    if (n > 1) duplicadas.add(col);
  });
  return duplicadas;
}

/**
 * Convierte una fila del archivo en datos del CV según el mapeo.
 */
export function filaACV(fila: FilaArchivo, mapeo: Mapeo): DatosCV {
  const cv: DatosCV = { ...CV_VACIO };
  for (const def of CAMPOS_CV) {
    const col = mapeo[def.clave];
    cv[def.clave] = col ? (fila[col] ?? "") : "";
  }
  return cv;
}
