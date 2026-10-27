import { CAMPOS_CV } from "../types";
import type { Mapeo, CampoCV } from "../types";
import { mapeoCompleto } from "../utils/mapping";

interface Props {
  encabezados: string[];
  mapeo: Mapeo;
  // Cambia la columna asignada a un campo del CV.
  onCambiar: (campo: CampoCV, columna: string) => void;
  // Confirma el mapeo (solo habilitado si está completo).
  onConfirmar: () => void;
  confirmado: boolean;
}

/**
 * Column Mapper: un <select> por cada campo del CV con las columnas del
 * archivo como opciones. El botón "Confirmar mapeo" se habilita solo
 * cuando todos los campos tienen una columna asignada.
 */
export function ColumnMapper({
  encabezados,
  mapeo,
  onCambiar,
  onConfirmar,
  confirmado,
}: Props) {
  const completo = mapeoCompleto(mapeo);

  return (
    <section className="tarjeta">
      <h2>2. Asociar columnas del archivo con los campos del CV</h2>
      <p className="ayuda">
        Sugerimos un mapeo automático por similitud de nombre. Revisalo y
        ajustá lo que haga falta.
      </p>

      <div className="grilla-mapeo">
        {CAMPOS_CV.map((def) => (
          <div key={def.clave} className="fila-mapeo">
            <label htmlFor={`map-${def.clave}`}>{def.etiqueta}</label>
            <select
              id={`map-${def.clave}`}
              value={mapeo[def.clave]}
              disabled={confirmado}
              onChange={(e) => onCambiar(def.clave, e.target.value)}
            >
              <option value="">— Seleccionar columna —</option>
              {encabezados.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!confirmado && (
        <button
          className="boton-primario"
          disabled={!completo}
          onClick={onConfirmar}
        >
          Confirmar mapeo
        </button>
      )}

      {!completo && !confirmado && (
        <p className="ayuda">Mapeá todos los campos para continuar.</p>
      )}
      {confirmado && <p className="estado">✓ Mapeo confirmado.</p>}
    </section>
  );
}
