import { useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  PencilLine,
  Search,
} from "lucide-react";
import type { CampoDinamico, Filtros, Orden, Registro } from "../types";
import { errorDeCampo } from "../utils/validacion";

interface Props {
  // Solo los campos visibles, en orden.
  campos: CampoDinamico[];
  // Registros con las ediciones ya aplicadas.
  registros: Registro[];
  // Índices que pasan el buscador y los filtros, ya ordenados.
  indices: number[];
  // Índices de las filas que tienen ediciones.
  editadas: Set<number>;
  indiceSeleccionado: number | null;
  onSeleccionar: (indice: number) => void;
  busqueda: string;
  onBuscar: (texto: string) => void;
  filtros: Filtros;
  // Panel de filtros (se muestra debajo del buscador).
  panelFiltros: ReactNode;
  orden: Orden | null;
  // Columnas por las que se puede ordenar (las no sensibles).
  ordenables: Set<string>;
  onOrdenar: (columna: string) => void;
  // soloFiltrados = exportar solo las filas que se ven (en su orden).
  onDescargarCSV: (soloFiltrados: boolean) => void;
  onDescargarExcel: (soloFiltrados: boolean) => void;
}

const FILAS_POR_PAGINA = 25;

/**
 * Tabla de registros generada con los campos visibles: buscador, filtros,
 * orden por columna, paginación, marca de filas editadas y selección de
 * fila con clic o teclado.
 */
export function RecordTable({
  campos,
  registros,
  indices,
  editadas,
  indiceSeleccionado,
  onSeleccionar,
  busqueda,
  onBuscar,
  filtros,
  panelFiltros,
  orden,
  ordenables,
  onOrdenar,
  onDescargarCSV,
  onDescargarExcel,
}: Props) {
  const [pagina, setPagina] = useState(0);
  const [soloFiltrados, setSoloFiltrados] = useState(true);

  const hayFiltrado = indices.length !== registros.length;
  const exportarFiltrados = hayFiltrado && soloFiltrados;

  const totalPaginas = Math.max(1, Math.ceil(indices.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const desde = paginaActual * FILAS_POR_PAGINA;
  const visiblesEnPagina = indices.slice(desde, desde + FILAS_POR_PAGINA);

  // Al cambiar la búsqueda, los filtros o el orden, volvemos a la página 1.
  useEffect(() => {
    setPagina(0);
  }, [busqueda, filtros, orden]);

  // Si la fila elegida cambia (por ejemplo con Anterior/Siguiente del
  // formulario), saltamos a la página que la contiene.
  useEffect(() => {
    if (indiceSeleccionado === null) return;
    const posicion = indices.indexOf(indiceSeleccionado);
    if (posicion >= 0) setPagina(Math.floor(posicion / FILAS_POR_PAGINA));
    // Solo reaccionamos al cambio de selección, no a cada búsqueda.
  }, [indiceSeleccionado]);

  function manejarTecla(e: KeyboardEvent<HTMLTableRowElement>, indice: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // evita el scroll con la barra espaciadora
      onSeleccionar(indice);
    }
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <span className={`num-seccion${indiceSeleccionado !== null ? " hecho" : ""}`}>
            {indiceSeleccionado !== null ? <Check size={16} strokeWidth={3} /> : "3"}
          </span>{" "}
          Tabla de registros
        </h2>
        <span className={`contador${hayFiltrado ? " contador-ok" : ""}`}>
          {hayFiltrado ? `${indices.length} de ${registros.length} filas` : `${registros.length} filas`} ·{" "}
          {editadas.size} editada{editadas.size === 1 ? "" : "s"}
        </span>
      </div>

      <div className="barra-tabla">
        <div className="buscador">
          <Search size={16} className="buscador-icono" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar en todas las columnas…"
            aria-label="Buscar registros"
            value={busqueda}
            onChange={(e) => onBuscar(e.target.value)}
          />
        </div>
        <button type="button" className="boton-secundario" onClick={() => onDescargarCSV(exportarFiltrados)}>
          <Download size={16} /> Descargar CSV
        </button>
        <button type="button" className="boton-secundario" onClick={() => onDescargarExcel(exportarFiltrados)}>
          <Download size={16} /> Descargar Excel
        </button>
      </div>

      {hayFiltrado && (
        <label className="opcion-exportar">
          <input
            type="checkbox"
            checked={soloFiltrados}
            onChange={(e) => setSoloFiltrados(e.target.checked)}
          />
          Exportar solo las {indices.length} filas filtradas (si no, se exportan las {registros.length})
        </label>
      )}

      {panelFiltros}

      {indices.length === 0 ? (
        <p className="ayuda vacio">Ningún registro coincide con la búsqueda y los filtros.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-registros">
            <thead>
              <tr>
                <th className="col-num">#</th>
                {campos.map((c) => {
                  const activo = orden?.columna === c.columna ? orden.direccion : null;
                  if (!ordenables.has(c.columna)) return <th key={c.columna}>{c.etiqueta}</th>;
                  return (
                    <th
                      key={c.columna}
                      aria-sort={activo === "asc" ? "ascending" : activo === "desc" ? "descending" : "none"}
                    >
                      <button
                        type="button"
                        className={`th-orden${activo ? " th-orden-activo" : ""}`}
                        title="Ordenar por esta columna"
                        onClick={() => onOrdenar(c.columna)}
                      >
                        {c.etiqueta}
                        {activo === "asc" ? (
                          <ArrowUp size={14} />
                        ) : activo === "desc" ? (
                          <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="th-orden-icono" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visiblesEnPagina.map((indice) => {
                const registro = registros[indice];
                const activo = indice === indiceSeleccionado;
                const editada = editadas.has(indice);
                const clases = [activo ? "fila-seleccionada" : "", editada ? "fila-editada" : ""]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr
                    key={indice}
                    className={clases}
                    tabIndex={0}
                    aria-selected={activo}
                    onClick={() => onSeleccionar(indice)}
                    onKeyDown={(e) => manejarTecla(e, indice)}
                  >
                    <td className="col-num">
                      <span className="con-icono">
                        {indice + 1}
                        {editada && (
                          <span className="punto-editado" title="Fila editada">
                            <PencilLine size={13} aria-label="Fila editada" />
                          </span>
                        )}
                      </span>
                    </td>
                    {campos.map((c) => {
                      const valor = registro[c.columna] ?? "";
                      const conError = errorDeCampo(c, valor) !== "";
                      return (
                        <td key={c.columna} className={conError ? "celda-error" : ""} title={valor}>
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {indices.length > 0 && (
        <div className="paginacion">
          <span className="ayuda">
            Mostrando {desde + 1}–{desde + visiblesEnPagina.length} de {indices.length}
          </span>
          <div className="paginacion-botones">
            <button
              type="button"
              className="boton-secundario"
              disabled={paginaActual === 0}
              onClick={() => setPagina(paginaActual - 1)}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="ayuda">
              Página {paginaActual + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              className="boton-secundario"
              disabled={paginaActual >= totalPaginas - 1}
              onClick={() => setPagina(paginaActual + 1)}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
