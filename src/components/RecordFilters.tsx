import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, ShieldAlert, X } from "lucide-react";
import type { CampoDinamico, FiltroCampo, Filtros, Registro } from "../types";
import { filtroActivo, opcionesLista } from "../utils/filtros";
import { esNumeroValido } from "../utils/validacion";

interface Props {
  // Campos que admiten filtro (visibles y no sensibles).
  campos: CampoDinamico[];
  // Campos visibles excluidos por ser datos sensibles (solo para avisar).
  excluidos: CampoDinamico[];
  registros: Registro[];
  columnasLista: Set<string>;
  filtros: Filtros;
  // Reemplaza el filtro de una columna (null lo quita).
  onCambiar: (columna: string, filtro: FiltroCampo | null) => void;
  onLimpiar: () => void;
}

// Cantidad máxima de chips por columna de listas (los más frecuentes).
const MAX_OPCIONES = 40;

// Texto mal escrito en un mínimo/máximo: se marca y se ignora.
function numeroInvalido(texto: string | undefined) {
  return typeof texto === "string" && texto.trim() !== "" && !esNumeroValido(texto);
}

/**
 * Panel de filtros generado según el tipo de cada campo visible:
 * rango para números, chips para listas separadas por coma, "contiene"
 * para texto y válido/inválido para correos.
 */
export function RecordFilters({
  campos,
  excluidos,
  registros,
  columnasLista,
  filtros,
  onCambiar,
  onLimpiar,
}: Props) {
  const activos = campos.filter((c) => filtroActivo(c, filtros[c.columna], columnasLista.has(c.columna))).length;
  const [abierto, setAbierto] = useState(activos > 0);

  // Combina cambios con el filtro actual de la columna.
  function actualizar(columna: string, cambios: Partial<FiltroCampo>) {
    onCambiar(columna, { ...(filtros[columna] ?? {}), ...cambios });
  }

  return (
    <div className="filtros">
      <div className="filtros-cabecera">
        <button
          type="button"
          className="boton-secundario"
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
        >
          <Filter size={16} /> Filtros
          {activos > 0 && <span className="filtros-cuenta">{activos}</span>}
          {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {activos > 0 && (
          <button type="button" className="boton-enlace" onClick={onLimpiar}>
            <X size={15} /> Limpiar filtros
          </button>
        )}
      </div>

      {abierto && (
        <>
          {campos.length === 0 ? (
            <p className="ayuda">No hay campos visibles para filtrar.</p>
          ) : (
            <div className="filtros-grilla">
              {campos.map((c, i) => {
                const filtro = filtros[c.columna] ?? {};
                const activo = filtroActivo(c, filtros[c.columna], columnasLista.has(c.columna));
                const id = `filtro-${i}`;
                return (
                  <fieldset key={c.columna} className={`filtro${activo ? " filtro-activo" : ""}`}>
                    <legend>{c.etiqueta}</legend>

                    {c.tipo === "numero" && (
                      <div className="filtro-rango">
                        <label htmlFor={`${id}-min`}>Mín.</label>
                        <input
                          id={`${id}-min`}
                          type="text"
                          inputMode="decimal"
                          placeholder="—"
                          value={filtro.min ?? ""}
                          className={numeroInvalido(filtro.min) ? "input-error" : ""}
                          aria-invalid={numeroInvalido(filtro.min)}
                          onChange={(e) => actualizar(c.columna, { min: e.target.value })}
                        />
                        <label htmlFor={`${id}-max`}>Máx.</label>
                        <input
                          id={`${id}-max`}
                          type="text"
                          inputMode="decimal"
                          placeholder="—"
                          value={filtro.max ?? ""}
                          className={numeroInvalido(filtro.max) ? "input-error" : ""}
                          aria-invalid={numeroInvalido(filtro.max)}
                          onChange={(e) => actualizar(c.columna, { max: e.target.value })}
                        />
                      </div>
                    )}

                    {c.tipo === "email" && (
                      <select
                        aria-label={`Filtro de ${c.etiqueta}`}
                        value={filtro.correo ?? ""}
                        onChange={(e) =>
                          actualizar(c.columna, {
                            correo: (e.target.value || undefined) as FiltroCampo["correo"],
                          })
                        }
                      >
                        <option value="">Todos</option>
                        <option value="validos">Solo válidos</option>
                        <option value="invalidos">Solo inválidos</option>
                      </select>
                    )}

                    {c.tipo === "texto" && columnasLista.has(c.columna) && (
                      <FiltroLista
                        campo={c}
                        registros={registros}
                        filtro={filtro}
                        onCambiar={(cambios) => actualizar(c.columna, cambios)}
                      />
                    )}

                    {c.tipo === "texto" && !columnasLista.has(c.columna) && (
                      <input
                        type="text"
                        placeholder="Contiene…"
                        aria-label={`Filtro de ${c.etiqueta}`}
                        value={filtro.texto ?? ""}
                        onChange={(e) => actualizar(c.columna, { texto: e.target.value })}
                      />
                    )}
                  </fieldset>
                );
              })}
            </div>
          )}

          {excluidos.length > 0 && (
            <p className="alerta alerta-aviso con-icono">
              <ShieldAlert size={18} />
              <span>
                Sin filtro ni orden por {excluidos.map((c) => `"${c.etiqueta}"`).join(", ")}: son
                datos personales sensibles y no deberían usarse para seleccionar personas.
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface PropsLista {
  campo: CampoDinamico;
  registros: Registro[];
  filtro: FiltroCampo;
  onCambiar: (cambios: Partial<FiltroCampo>) => void;
}

// Chips con los valores de una columna de listas (ej: tecnologías).
function FiltroLista({ campo, registros, filtro, onCambiar }: PropsLista) {
  const opciones = opcionesLista(campo.columna, registros).slice(0, MAX_OPCIONES);
  const elegidos = Array.isArray(filtro.valores) ? filtro.valores : [];
  const claves = new Set(elegidos.map((v) => v.toLowerCase()));

  function alternar(valor: string) {
    const ya = claves.has(valor.toLowerCase());
    onCambiar({
      valores: ya ? elegidos.filter((v) => v.toLowerCase() !== valor.toLowerCase()) : [...elegidos, valor],
    });
  }

  return (
    <>
      <div className="filtro-modo" role="radiogroup" aria-label={`Modo de ${campo.etiqueta}`}>
        <label>
          <input
            type="radio"
            name={`modo-${campo.columna}`}
            checked={filtro.modo !== "alguno"}
            onChange={() => onCambiar({ modo: "todos" })}
          />
          Todos
        </label>
        <label>
          <input
            type="radio"
            name={`modo-${campo.columna}`}
            checked={filtro.modo === "alguno"}
            onChange={() => onCambiar({ modo: "alguno" })}
          />
          Alguno
        </label>
      </div>
      <ul className="chips chips-filtro">
        {opciones.map((o) => {
          const activo = claves.has(o.valor.toLowerCase());
          return (
            <li key={o.valor}>
              <button
                type="button"
                className={`chip chip-boton${activo ? " chip-activo" : ""}`}
                aria-pressed={activo}
                onClick={() => alternar(o.valor)}
              >
                {o.valor} <span className="chip-cuenta">{o.cantidad}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
