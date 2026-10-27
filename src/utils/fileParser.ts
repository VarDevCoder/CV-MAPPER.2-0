import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Hoja, LibroImportado, Registro } from "../types";

/**
 * Convierte cualquier valor de celda a texto.
 * - Fechas de Excel -> AAAA-MM-DD
 * - Números -> sin separadores de miles (para poder validarlos después)
 */
function valorATexto(valor: unknown): string {
  if (valor == null) return "";
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return "";
    const mm = String(valor.getMonth() + 1).padStart(2, "0");
    const dd = String(valor.getDate()).padStart(2, "0");
    return `${valor.getFullYear()}-${mm}-${dd}`;
  }
  return String(valor).trim();
}

/**
 * Limpia los encabezados: nombra las columnas sin título ("Columna 3")
 * y desambigua repetidos ("Nombre", "Nombre (2)").
 * Devuelve también qué columnas no tenían título en el archivo.
 */
function limpiarEncabezados(crudos: unknown[]): { nombres: string[]; sinTitulo: Set<string> } {
  const usados = new Map<string, number>();
  const sinTitulo = new Set<string>();
  const nombres = crudos.map((h, i) => {
    let nombre = valorATexto(h);
    const vacio = nombre === "";
    if (vacio) nombre = `Columna ${i + 1}`;
    const repeticiones = usados.get(nombre) ?? 0;
    usados.set(nombre, repeticiones + 1);
    const final = repeticiones === 0 ? nombre : `${nombre} (${repeticiones + 1})`;
    if (vacio) sinTitulo.add(final);
    return final;
  });
  return { nombres, sinTitulo };
}

/**
 * Convierte una matriz de celdas (fila por fila) en una Hoja:
 * la primera fila con datos son los encabezados y el resto, registros.
 * Devuelve null si la matriz no tiene contenido.
 */
function matrizAHoja(nombre: string, matriz: unknown[][]): Hoja | null {
  // Descartamos filas totalmente vacías.
  const filasConDatos = matriz.filter((fila) => fila.some((v) => valorATexto(v) !== ""));
  if (filasConDatos.length === 0) return null;

  // Ancho real de la tabla (la fila más larga).
  const ancho = filasConDatos.reduce((max, fila) => Math.max(max, fila.length), 0);
  const cabecera = Array.from({ length: ancho }, (_, i) => filasConDatos[0][i]);
  const { nombres, sinTitulo } = limpiarEncabezados(cabecera);

  const filas: Registro[] = filasConDatos.slice(1).map((fila) => {
    const registro: Registro = {};
    nombres.forEach((col, i) => {
      registro[col] = valorATexto(fila[i]);
    });
    return registro;
  });

  // Quitamos columnas sin título que además están totalmente vacías
  // (típico de Excel con celdas formateadas a la derecha de la tabla).
  const encabezados = nombres.filter(
    (col) => !(sinTitulo.has(col) && filas.every((f) => f[col] === ""))
  );

  return { nombre, encabezados, filas };
}

/**
 * Parsea un CSV con PapaParse. El separador (, o ;) se autodetecta y la
 * codificación es UTF-8. Se lee como matriz para tratar los encabezados
 * igual que en Excel.
 */
function parsearCSV(archivo: File): Promise<Hoja[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<unknown[]>(archivo, {
      header: false,
      skipEmptyLines: "greedy",
      encoding: "utf-8",
      delimiter: "", // "" => PapaParse autodetecta , o ;
      complete: (resultado) => {
        const hoja = matrizAHoja(archivo.name, resultado.data);
        resolve(hoja ? [hoja] : []);
      },
      error: (err) => reject(new Error(`Error al leer el CSV: ${err.message}`)),
    });
  });
}

/**
 * Parsea un Excel con SheetJS. Lee TODAS las hojas: cada una puede tener
 * una tabla distinta y el usuario elige cuál usar.
 */
async function parsearExcel(archivo: File): Promise<Hoja[]> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array", cellDates: true });

  const hojas: Hoja[] = [];
  for (const nombreHoja of libro.SheetNames) {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
      header: 1, // matriz de arrays, fila por fila
      raw: true, // valores reales (números sin formato, fechas como Date)
      defval: "",
      blankrows: false,
    });
    const hoja = matrizAHoja(nombreHoja, matriz);
    if (hoja) hojas.push(hoja);
  }
  return hojas;
}

/**
 * Punto de entrada único: decide el parser según la extensión y valida
 * que haya al menos una hoja con encabezados y filas de datos.
 */
export async function parsearArchivo(archivo: File): Promise<LibroImportado> {
  if (archivo.size === 0) {
    throw new Error("El archivo está vacío.");
  }

  const nombre = archivo.name.toLowerCase();
  let hojas: Hoja[];

  if (nombre.endsWith(".csv")) {
    hojas = await parsearCSV(archivo);
  } else if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
    hojas = await parsearExcel(archivo);
  } else {
    throw new Error("Formato no soportado. Subí un archivo .csv o .xlsx.");
  }

  // Solo sirven las hojas que tienen al menos una fila de datos.
  const conDatos = hojas.filter((h) => h.encabezados.length > 0 && h.filas.length > 0);
  if (conDatos.length === 0) {
    throw new Error("El archivo no contiene filas de datos (solo encabezados o nada).");
  }

  return { hojas: conDatos };
}
