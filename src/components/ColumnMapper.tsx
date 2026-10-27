import { CAMPOS_CV } from "../types";
import type { Mapeo, CampoCV, FilaArchivo } from "../types";
import { mapeoCompleto, columnasDuplicadas } from "../utils/mapping";

interface Props {
  encabezados: string[];
  filas: FilaArchivo[];
  mapeo: Mapeo;
  // Cambia la columna asignada a un campo del CV.
  onCambiar: (campo: CampoCV, columna: string) => void;
  // Confirma el mapeo (solo habilitado si está completo y sin duplicados).
  onConfirmar: () => void;
  // Vuelve a habilitar la edición del mapeo ya confirmado.
  onEditar: () => void;
  confirmado: boolean;
}

// Cantidad de filas que se muestran en la vista previa del archivo.
const FILAS_PREVIA = 3;

/**
 * Column Mapper: un <select> por cada campo del CV con las columnas del
 * archivo como opciones, un valor de ejemplo de la primera fila y avisos
 * de columnas duplicadas. "Confirmar mapeo" se habilita solo cuando
 * todos los campos tienen una columna distinta asignada.
 */
export function ColumnMapper({
  encabezados,
  filas,
  mapeo,
  onCambiar,
  onConfirmar,
  onEditar,
  confirmado,
}: Props) {
  const completo = mapeoCompleto(mapeo);
  const duplicadas = columnasDuplicadas(mapeo);
  const mapeados = CAMPOS_CV.filter((def) => mapeo[def.clave] !== "").length;
  const puedeConfirmar = completo && duplicadas.size === 0;
  const primeraFila = filas[0];

  // Vista resumida una vez confirmado el mapeo.
  if (confirmado) {
    return (
      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <span className="num-seccion hecho">✓</span> Columnas mapeadas
          </h2>
          <button className="boton-secundario" onClick={onEditar}>
            Editar mapeo
          </button>
        </div>
        <ul className="resumen-mapeo">
          {CAMPOS_CV.map((def) => (
            <li key={def.clave}>
              <span className="ayuda">{def.etiqueta}</span>
              <span className="columna-tag">{mapeo[def.clave]}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <span className="num-seccion">2</span> Asociar columnas con los campos del CV
        </h2>
        <span className={`contador${completo ? " contador-ok" : ""}`}>
          {mapeados} de {CAMPOS_CV.length} campos
        </span>
      </div>
      <p className="ayuda">
        Sugerimos un mapeo automático por similitud de nombre. Revisalo con el
        valor de ejemplo y ajustá lo que haga falta.
      </p>

      <div className="lista-mapeo">
        {CAMPOS_CV.map((def) => {
          const columna = mapeo[def.clave];
          const esDuplicada = columna !== "" && duplicadas.has(columna);
          const ejemplo = columna && primeraFila ? primeraFila[columna] : "";
          const estado = columna === "" ? "vacio" : esDuplicada ? "duplicado" : "ok";

          return (
            <div key={def.clave} className={`fila-mapeo fila-${estado}`}>
              <label htmlFor={`map-${def.clave}`} className="fila-mapeo-campo">
                <span className="estado-icono" aria-hidden="true">
                  {estado === "ok" ? "✓" : estado === "duplicado" ? "!" : "○"}
                </span>
                {def.etiqueta}
              </label>
              <span className="flecha" aria-hidden="true">←</span>
              <div className="fila-mapeo-control">
                <select
                  id={`map-${def.clave}`}
                  value={columna}
                  aria-invalid={esDuplicada}
                  onChange={(e) => onCambiar(def.clave, e.target.value)}
                >
                  <option value="">— Elegir columna —</option>
                  {encabezados.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                {esDuplicada ? (
                  <span className="error">Esta columna ya está asignada a otro campo.</span>
                ) : (
                  columna && (
                    <span className="ejemplo" title={ejemplo}>
                      Ej: {ejemplo || <em>(vacío)</em>}
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <details className="vista-previa">
        <summary>Ver las primeras {Math.min(FILAS_PREVIA, filas.length)} filas del archivo</summary>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                {encabezados.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, FILAS_PREVIA).map((fila, i) => (
                <tr key={i}>
                  {encabezados.map((col) => (
                    <td key={col}>{fila[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="acciones">
        <button className="boton-primario" disabled={!puedeConfirmar} onClick={onConfirmar}>
          Confirmar mapeo →
        </button>
        {!puedeConfirmar && (
          <span className="ayuda">
            {!completo
              ? `Faltan ${CAMPOS_CV.length - mapeados} campo(s) por mapear.`
              : "Resolvé las columnas duplicadas para continuar."}
          </span>
        )}
      </div>
    </section>
  );
}
