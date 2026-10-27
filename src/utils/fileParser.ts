import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DatosImportados, FilaArchivo } from "../types";

/**
 * Parsea un archivo CSV usando PapaParse.
 *
 * - Detecta automáticamente el separador (coma o punto y coma) dejando
 *   `delimiter` vacío: Papa lo infiere analizando las primeras filas.
 * - Fuerza codificación UTF-8 al leer el archivo.
 * - Usa `header: true` para obtener objetos { columna: valor }.
 */
function parsearCSV(archivo: File): Promise<DatosImportados> {
  return new Promise((resolve, reject) => {
    Papa.parse<FilaArchivo>(archivo, {
      header: true,
      skipEmptyLines: true,
      encoding: "utf-8",
      delimiter: "", // "" => PapaParse autodetecta , o ;
      transformHeader: (h) => h.trim(),
      complete: (resultado) => {
        const encabezados = (resultado.meta.fields ?? []).map((f) => f.trim());

        if (encabezados.length === 0) {
          reject(new Error("El archivo CSV no tiene encabezados o está vacío."));
          return;
        }

        // Normalizamos cada fila: todo a texto y recortado.
        const filas: FilaArchivo[] = resultado.data.map((fila) => {
          const normalizada: FilaArchivo = {};
          for (const col of encabezados) {
            const v = (fila as FilaArchivo)[col];
            normalizada[col] = v == null ? "" : String(v).trim();
          }
          return normalizada;
        });

        if (filas.length === 0) {
          reject(new Error("El archivo CSV no contiene filas de datos."));
          return;
        }

        resolve({ encabezados, filas });
      },
      error: (err) => reject(new Error(`Error al leer el CSV: ${err.message}`)),
    });
  });
}

/**
 * Parsea un archivo Excel (.xlsx) usando SheetJS.
 *
 * Lee la primera hoja, toma la primera fila como encabezados y el resto
 * como datos. Todos los valores se convierten a texto para unificar el
 * tratamiento con el CSV.
 */
async function parsearExcel(archivo: File): Promise<DatosImportados> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array" });

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) {
    throw new Error("El archivo Excel no contiene ninguna hoja.");
  }

  const hoja = libro.Sheets[nombreHoja];

  // header: 1 => devuelve una matriz de arrays (fila por fila).
  const matriz = XLSX.utils.sheet_to_json<string[]>(hoja, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false, // formatea números/fechas como texto legible
  });

  if (matriz.length === 0) {
    throw new Error("El archivo Excel está vacío.");
  }

  const encabezados = (matriz[0] ?? []).map((h) => String(h).trim());
  if (encabezados.length === 0) {
    throw new Error("La primera hoja del Excel no tiene encabezados.");
  }

  const filas: FilaArchivo[] = matriz.slice(1).map((fila) => {
    const normalizada: FilaArchivo = {};
    encabezados.forEach((col, i) => {
      const v = fila[i];
      normalizada[col] = v == null ? "" : String(v).trim();
    });
    return normalizada;
  });

  if (filas.length === 0) {
    throw new Error("El archivo Excel no contiene filas de datos.");
  }

  return { encabezados, filas };
}

/**
 * Punto de entrada único: decide el parser según la extensión del archivo.
 * Lanza un error claro si el formato no está soportado.
 */
export async function parsearArchivo(archivo: File): Promise<DatosImportados> {
  if (archivo.size === 0) {
    throw new Error("El archivo está vacío.");
  }

  const nombre = archivo.name.toLowerCase();

  if (nombre.endsWith(".csv")) {
    return parsearCSV(archivo);
  }
  if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
    return parsearExcel(archivo);
  }

  throw new Error(
    "Formato no soportado. Subí un archivo .csv o .xlsx."
  );
}
