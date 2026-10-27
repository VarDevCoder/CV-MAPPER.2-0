import type { CampoDinamico, FiltroCampo, Filtros, Orden, Registro } from "../types";
import { normalizar } from "./inferencia";
import { esCorreoValido, esNumeroValido } from "./validacion";
import { listaHabilidades } from "./formato";

/**
 * Indica si una columna de texto contiene listas separadas por coma
 * (ej: tecnologías): al menos la mitad de sus valores tienen 2 o más ítems.
 */
export function esColumnaLista(campo: CampoDinamico, registros: Registro[]): boolean {
  if (campo.tipo !== "texto") return false;
  const valores = registros.map((r) => (r[campo.columna] ?? "").trim()).filter((v) => v !== "");
  if (valores.length === 0) return false;
  const conVarios = valores.filter((v) => listaHabilidades(v).length > 1).length;
  return conVarios / valores.length >= 0.5;
}

/**
 * Valores distintos que aparecen en una columna de listas, con cuántas
 * filas los tienen. Ordenados de más a menos frecuente.
 */
export function opcionesLista(columna: string, registros: Registro[]) {
  const conteo = new Map<string, { valor: string; cantidad: number }>();
  for (const r of registros) {
    // Un ítem repetido en la misma fila cuenta una sola vez.
    const vistos = new Set<string>();
    for (const item of listaHabilidades(r[columna] ?? "")) {
      const clave = normalizar(item);
      if (clave === "" || vistos.has(clave)) continue;
      vistos.add(clave);
      const actual = conteo.get(clave);
      if (actual) actual.cantidad++;
      else conteo.set(clave, { valor: item, cantidad: 1 });
    }
  }
  return [...conteo.values()].sort(
    (a, b) => b.cantidad - a.cantidad || a.valor.localeCompare(b.valor, "es")
  );
}

// Texto con un número válido o null (para min/max vacíos o mal escritos).
function numeroONull(texto: string | undefined): number | null {
  return typeof texto === "string" && esNumeroValido(texto) ? Number(texto) : null;
}

// Indica si el filtro de un campo restringe algo.
export function filtroActivo(campo: CampoDinamico, filtro: FiltroCampo | undefined, esLista: boolean) {
  if (!filtro) return false;
  if (campo.tipo === "numero") return numeroONull(filtro.min) !== null || numeroONull(filtro.max) !== null;
  if (campo.tipo === "email") return filtro.correo === "validos" || filtro.correo === "invalidos";
  if (esLista && Array.isArray(filtro.valores) && filtro.valores.length > 0) return true;
  return typeof filtro.texto === "string" && normalizar(filtro.texto) !== "";
}

// Indica si un valor cumple el filtro de su campo.
function cumpleFiltro(campo: CampoDinamico, filtro: FiltroCampo, valor: string, esLista: boolean) {
  if (campo.tipo === "numero") {
    const min = numeroONull(filtro.min);
    const max = numeroONull(filtro.max);
    if (min === null && max === null) return true;
    // Con un rango activo, los vacíos o inválidos quedan afuera.
    if (!esNumeroValido(valor)) return false;
    const n = Number(valor);
    return (min === null || n >= min) && (max === null || n <= max);
  }
  if (campo.tipo === "email") {
    if (filtro.correo !== "validos" && filtro.correo !== "invalidos") return true;
    if (valor.trim() === "") return false;
    return esCorreoValido(valor) === (filtro.correo === "validos");
  }
  if (esLista && Array.isArray(filtro.valores) && filtro.valores.length > 0) {
    const items = new Set(listaHabilidades(valor).map(normalizar));
    const exigidos = filtro.valores.map(normalizar);
    const ok = filtro.modo === "alguno"
      ? exigidos.some((e) => items.has(e))
      : exigidos.every((e) => items.has(e));
    if (!ok) return false;
  }
  if (typeof filtro.texto === "string" && normalizar(filtro.texto) !== "") {
    return normalizar(valor).includes(normalizar(filtro.texto));
  }
  return true;
}

// Compara dos valores para ordenar. Los vacíos van siempre al final.
function comparar(campo: CampoDinamico, a: string, b: string, direccion: "asc" | "desc"): number {
  const vacioA = a.trim() === "";
  const vacioB = b.trim() === "";
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1;
  let r: number;
  if (campo.tipo === "numero") {
    const na = esNumeroValido(a) ? Number(a) : null;
    const nb = esNumeroValido(b) ? Number(b) : null;
    // Los inválidos van después de los números, antes de los vacíos.
    if (na === null || nb === null) return na === nb ? 0 : na === null ? 1 : -1;
    r = na - nb;
  } else {
    r = a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
  }
  return direccion === "asc" ? r : -r;
}

interface Opciones {
  registros: Registro[];
  // Campos visibles (el buscador recorre todos).
  camposVisibles: CampoDinamico[];
  // Campos que admiten filtro y orden (visibles y no sensibles).
  camposFiltrables: CampoDinamico[];
  columnasLista: Set<string>;
  filtros: Filtros;
  busqueda: string;
  orden: Orden | null;
}

/**
 * Devuelve los índices de las filas que pasan el buscador y los filtros,
 * en el orden elegido (o en el del archivo si no hay orden).
 */
export function aplicarFiltros({
  registros,
  camposVisibles,
  camposFiltrables,
  columnasLista,
  filtros,
  busqueda,
  orden,
}: Opciones): number[] {
  const termino = normalizar(busqueda);
  const activos = camposFiltrables.filter((c) =>
    filtroActivo(c, filtros[c.columna], columnasLista.has(c.columna))
  );

  const indices = registros
    .map((_, i) => i)
    .filter((i) => {
      const r = registros[i];
      if (termino !== "" && !camposVisibles.some((c) => normalizar(r[c.columna] ?? "").includes(termino))) {
        return false;
      }
      return activos.every((c) =>
        cumpleFiltro(c, filtros[c.columna], r[c.columna] ?? "", columnasLista.has(c.columna))
      );
    });

  const campoOrden = orden ? camposFiltrables.find((c) => c.columna === orden.columna) : undefined;
  if (orden && campoOrden) {
    // Desempate por índice para que el orden sea estable.
    indices.sort(
      (a, b) =>
        comparar(campoOrden, registros[a][orden.columna] ?? "", registros[b][orden.columna] ?? "", orden.direccion) ||
        a - b
    );
  }
  return indices;
}
