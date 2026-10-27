import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Download, PencilLine, Search } from "lucide-react";
import type { CampoDinamico, Registro } from "../types";
import { normalizar } from "../utils/inferencia";
import { errorDeCampo } from "../utils/validacion";

interface Props {
  // Solo los campos visibles, en orden.
  campos: CampoDinamico[];
  // Registros con las ediciones ya aplicadas.
  registros: Registro[];
  // Índices de las filas que tienen ediciones.
  editadas: Set<number>;
  indiceSeleccionado: number | null;
  onSeleccionar: (indice: number) => void;
  onDescargarCSV: () => void;
  onDescargarExcel: () => void;
}

const FILAS_POR_PAGINA = 25;

/**
 * Tabla de registros generada con los campos visibles: buscador sobre
 * todas las columnas, paginación, marca de filas editadas y selección de
 * fila con clic o teclado.
 */
export function RecordTable({
  campos,
  registros,
  editadas,
  indiceSeleccionado,
  onSeleccionar,
  onDescargarCSV,
  onDescargarExcel,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);

  // Índices de las filas que coinciden con la búsqueda (sin acentos).
  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    const indices = registros.map((_, i) => i);
    if (termino === "") return indices;
    return indices.filter((i) =>
      campos.some((c) => normalizar(registros[i][c.columna] ?? "").includes(termino))
    );
  }, [busqueda, registros, campos]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const desde = paginaActual * FILAS_POR_PAGINA;
  const visiblesEnPagina = filtrados.slice(desde, desde + FILAS_POR_PAGINA);

  // Si la fila elegida cambia (por ejemplo con Anterior/Siguiente del
  // formulario), saltamos a la página que la contiene.
  useEffect(() => {
    if (indiceSeleccionado === null) return;
    const posicion = filtrados.indexOf(indiceSeleccionado);
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
        <span className="contador">
          {registros.length} filas · {editadas.size} editada{editadas.size === 1 ? "" : "s"}
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
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(0);
            }}
          />
        </div>
        <button type="button" className="boton-secundario" onClick={onDescargarCSV}>
          <Download size={16} /> Descargar CSV
        </button>
        <button type="button" className="boton-secundario" onClick={onDescargarExcel}>
          <Download size={16} /> Descargar Excel
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="ayuda vacio">Ningún registro coincide con “{busqueda}”.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-registros">
            <thead>
              <tr>
                <th className="col-num">#</th>
                {campos.map((c) => (
                  <th key={c.columna}>{c.etiqueta}</th>
                ))}
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

      {filtrados.length > 0 && (
        <div className="paginacion">
          <span className="ayuda">
            Mostrando {desde + 1}–{desde + visiblesEnPagina.length} de {filtrados.length}
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
