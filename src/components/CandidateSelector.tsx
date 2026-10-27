import { useState } from "react";
import type { DatosImportados, Mapeo } from "../types";
import { iniciales } from "../utils/formato";

interface Props {
  datos: DatosImportados;
  mapeo: Mapeo;
  indiceSeleccionado: number | null;
  onSeleccionar: (indice: number) => void;
}

/**
 * Selector de candidatos: lista de tarjetas con buscador. Muestra el
 * nombre y el título profesional según las columnas mapeadas.
 */
export function CandidateSelector({ datos, mapeo, indiceSeleccionado, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState("");

  // Armamos la lista conservando el índice original de cada fila.
  const candidatos = datos.filas.map((fila, indice) => ({
    indice,
    nombre: fila[mapeo.nombreCompleto]?.trim() || `Fila ${indice + 1}`,
    titulo: fila[mapeo.tituloProfesional]?.trim() || "",
  }));

  const termino = busqueda.trim().toLowerCase();
  const filtrados = termino
    ? candidatos.filter(
        (c) => c.nombre.toLowerCase().includes(termino) || c.titulo.toLowerCase().includes(termino)
      )
    : candidatos;

  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <span className={`num-seccion${indiceSeleccionado !== null ? " hecho" : ""}`}>
            {indiceSeleccionado !== null ? "✓" : "3"}
          </span>{" "}
          Elegir candidato
        </h2>
        <span className="contador">{datos.filas.length} en el archivo</span>
      </div>

      <input
        type="search"
        className="buscador"
        placeholder="🔍 Buscar por nombre o título…"
        aria-label="Buscar candidato"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {filtrados.length === 0 ? (
        <p className="ayuda vacio">Ningún candidato coincide con “{busqueda}”.</p>
      ) : (
        <ul className="lista-candidatos">
          {filtrados.map((c) => {
            const activo = c.indice === indiceSeleccionado;
            return (
              <li key={c.indice}>
                <button
                  type="button"
                  className={`candidato${activo ? " candidato-activo" : ""}`}
                  aria-pressed={activo}
                  onClick={() => onSeleccionar(c.indice)}
                >
                  <span className="avatar" aria-hidden="true">
                    {iniciales(c.nombre)}
                  </span>
                  <span className="candidato-info">
                    <strong>{c.nombre}</strong>
                    {c.titulo && <span className="ayuda">{c.titulo}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
