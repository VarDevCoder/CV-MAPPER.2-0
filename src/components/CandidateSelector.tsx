import type { DatosImportados, Mapeo } from "../types";

interface Props {
  datos: DatosImportados;
  mapeo: Mapeo;
  indiceSeleccionado: number | null;
  onSeleccionar: (indice: number) => void;
}

/**
 * Selector de candidatos: una vez confirmado el mapeo, permite elegir
 * una fila del archivo. Usa la columna mapeada a "Nombre completo" para
 * etiquetar cada opción (con respaldo al número de fila).
 */
export function CandidateSelector({
  datos,
  mapeo,
  indiceSeleccionado,
  onSeleccionar,
}: Props) {
  const colNombre = mapeo.nombreCompleto;

  return (
    <section className="tarjeta">
      <h2>3. Elegir candidato</h2>
      <select
        value={indiceSeleccionado ?? ""}
        onChange={(e) => onSeleccionar(Number(e.target.value))}
      >
        <option value="" disabled>
          — Seleccionar candidato —
        </option>
        {datos.filas.map((fila, i) => {
          const etiqueta = fila[colNombre]?.trim() || `Fila ${i + 1}`;
          return (
            <option key={i} value={i}>
              {etiqueta}
            </option>
          );
        })}
      </select>
      <p className="ayuda">{datos.filas.length} candidato(s) en el archivo.</p>
    </section>
  );
}
