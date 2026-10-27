import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { CampoDinamico, Registro } from "../types";
import { esNumeroValido } from "./validacion";

type FilaExportada = Record<string, string | number>;

// Usa las etiquetas como encabezados. Si dos etiquetas coinciden, las
// desambigua ("Nombre", "Nombre (2)") para no pisar columnas.
function encabezadosUnicos(campos: CampoDinamico[]): string[] {
  const usados = new Map<string, number>();
  return campos.map((c) => {
    const base = c.etiqueta.trim() || c.columna;
    const n = (usados.get(base) ?? 0) + 1;
    usados.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}

// Arma las filas a exportar. Los campos numéricos válidos van como número.
function armarFilas(campos: CampoDinamico[], registros: Registro[]) {
  const encabezados = encabezadosUnicos(campos);
  const filas: FilaExportada[] = registros.map((registro) => {
    const fila: FilaExportada = {};
    campos.forEach((c, i) => {
      const valor = registro[c.columna] ?? "";
      fila[encabezados[i]] = c.tipo === "numero" && esNumeroValido(valor) ? Number(valor) : valor;
    });
    return fila;
  });
  return { encabezados, filas };
}

// Quita la extensión del archivo original para nombrar la descarga.
function nombreBase(nombreArchivo: string): string {
  return nombreArchivo.replace(/\.[^.]+$/, "") || "registros";
}

/**
 * Descarga los registros como CSV (separador coma). Lleva BOM UTF-8 para
 * que Excel muestre bien los acentos.
 */
export function descargarCSV(nombreArchivo: string, campos: CampoDinamico[], registros: Registro[]) {
  const { encabezados, filas } = armarFilas(campos, registros);
  const csv = Papa.unparse({ fields: encabezados, data: filas.map((f) => encabezados.map((e) => f[e])) });
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreBase(nombreArchivo)}_editado.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Descarga los registros como Excel (.xlsx) con una sola hoja.
 */
export function descargarExcel(
  nombreArchivo: string,
  nombreHoja: string,
  campos: CampoDinamico[],
  registros: Registro[]
) {
  const { encabezados, filas } = armarFilas(campos, registros);
  const hoja = XLSX.utils.json_to_sheet(filas, { header: encabezados });
  const libro = XLSX.utils.book_new();
  // Excel limita el nombre de hoja a 31 caracteres y prohíbe algunos símbolos.
  const nombre = nombreHoja.replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "Registros";
  XLSX.utils.book_append_sheet(libro, hoja, nombre);
  XLSX.writeFile(libro, `${nombreBase(nombreArchivo)}_editado.xlsx`);
}
