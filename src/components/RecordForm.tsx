import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, PencilLine, RotateCcw } from "lucide-react";
import type { CampoDinamico, Hoja, Registro } from "../types";
import { errorDeCampo, contarErrores } from "../utils/validacion";
import { columnaTitulo } from "../utils/inferencia";
import { iniciales, listaHabilidades, formatearNumero } from "../utils/formato";

interface Props {
  // Solo los campos visibles, en orden.
  campos: CampoDinamico[];
  // Hoja en uso: sus datos ayudan a elegir la columna del título.
  hoja: Hoja;
  // Valores actuales (con ediciones) y valores tal como vienen del archivo.
  registro: Registro;
  original: Registro;
  indice: number;
  total: number;
  onCambiar: (columna: string, valor: string) => void;
  // Descarta las ediciones y vuelve a los valores del archivo.
  onRestaurar: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

// Texto de ayuda según el tipo del campo.
function ayudaDeTipo(campo: CampoDinamico): string {
  if (campo.tipo === "numero") return campo.noNegativo ? "Número mayor o igual a 0." : "Número.";
  if (campo.tipo === "email") return "Ej: nombre@dominio.com";
  return "";
}

/**
 * Formulario del registro generado desde los campos visibles, con una
 * tarjeta de vista previa genérica. Valida según el tipo de cada campo y
 * marca los campos editados respecto del archivo.
 */
export function RecordForm({
  campos,
  hoja,
  registro,
  original,
  indice,
  total,
  onCambiar,
  onRestaurar,
  onAnterior,
  onSiguiente,
}: Props) {
  const valorDe = (c: CampoDinamico) => registro[c.columna] ?? "";
  const errores = contarErrores(campos, registro);
  const editado = campos.some((c) => valorDe(c) !== (original[c.columna] ?? ""));

  // Vista previa: título, chips (valores con comas) y el resto en una lista.
  const colTitulo = columnaTitulo(campos, hoja);
  const titulo = colTitulo ? (registro[colTitulo] ?? "").trim() : "";
  const resto = campos.filter((c) => c.columna !== colTitulo);
  const conChips = resto.filter((c) => c.tipo === "texto" && listaHabilidades(valorDe(c)).length > 1);
  const enLista = resto.filter((c) => !conChips.includes(c));

  function valorPrevia(c: CampoDinamico) {
    const valor = valorDe(c).trim();
    if (valor === "") return "—";
    const valido = errorDeCampo(c, valor) === "";
    if (c.tipo === "email" && valido) return <a href={`mailto:${valor}`}>{valor}</a>;
    if (c.tipo === "numero" && valido) return formatearNumero(valor);
    return valor;
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <span className="num-seccion">4</span> Registro {indice + 1} de {total}
        </h2>
        <div className="insignias">
          {editado && (
            <span className="insignia insignia-info">
              <PencilLine size={13} /> Editado
            </span>
          )}
          {errores > 0 ? (
            <span className="insignia insignia-error">
              <AlertCircle size={13} /> {errores} error{errores > 1 ? "es" : ""}
            </span>
          ) : (
            <span className="insignia insignia-ok">
              <CheckCircle2 size={13} /> Válido
            </span>
          )}
        </div>
      </div>

      <div className="cv-layout">
        {/* Columna izquierda: formulario editable */}
        <form className="formulario" onSubmit={(e) => e.preventDefault()} noValidate>
          {campos.map((c, i) => {
            const valor = valorDe(c);
            const error = errorDeCampo(c, valor);
            const cambiado = valor !== (original[c.columna] ?? "");
            const id = `campo-${i}`;
            const ayuda = error || ayudaDeTipo(c);
            const ancho = c.tipo === "texto" && (valor.length > 40 || listaHabilidades(valor).length > 1);

            return (
              <div key={c.columna} className={`campo${ancho ? " campo-ancho" : ""}`}>
                <label htmlFor={id}>
                  {c.etiqueta}
                  {cambiado && (
                    <span className="punto-editado" title="Modificado respecto del archivo">
                      <PencilLine size={13} />
                    </span>
                  )}
                </label>
                <input
                  id={id}
                  // Los numéricos usan texto + inputMode para poder mostrar
                  // el error si el valor no es un número.
                  type={c.tipo === "email" ? "email" : "text"}
                  inputMode={c.tipo === "numero" ? "decimal" : undefined}
                  value={valor}
                  className={error ? "input-error" : ""}
                  aria-invalid={error !== ""}
                  aria-describedby={ayuda ? `${id}-ayuda` : undefined}
                  onChange={(e) => onCambiar(c.columna, e.target.value)}
                />
                {ayuda && (
                  <span id={`${id}-ayuda`} className={error ? "error" : "ayuda"}>
                    {ayuda}
                  </span>
                )}
              </div>
            );
          })}

          <div className="acciones campo-ancho">
            <button type="button" className="boton-secundario" disabled={indice === 0} onClick={onAnterior}>
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              type="button"
              className="boton-secundario"
              disabled={indice >= total - 1}
              onClick={onSiguiente}
            >
              Siguiente <ChevronRight size={16} />
            </button>
            <button type="button" className="boton-secundario" disabled={!editado} onClick={onRestaurar}>
              <RotateCcw size={15} /> Restaurar valores del archivo
            </button>
          </div>
        </form>

        {/* Columna derecha: vista previa del registro */}
        <aside className="cv-preview" aria-label="Vista previa del registro">
          <div className="cv-preview-cabecera">
            <span className="avatar avatar-grande" aria-hidden="true">
              {titulo ? iniciales(titulo) : "#"}
            </span>
            <div>
              <h3>{titulo || `Registro ${indice + 1}`}</h3>
              {colTitulo && (
                <p className="cv-titulo">{campos.find((c) => c.columna === colTitulo)?.etiqueta}</p>
              )}
            </div>
          </div>

          {enLista.length > 0 && (
            <dl className="cv-datos">
              {enLista.map((c) => (
                <div key={c.columna} className="cv-dato">
                  <dt>{c.etiqueta}</dt>
                  <dd>{valorPrevia(c)}</dd>
                </div>
              ))}
            </dl>
          )}

          {conChips.map((c) => (
            <div key={c.columna} className="cv-chips">
              <h4>{c.etiqueta}</h4>
              <ul className="chips">
                {listaHabilidades(valorDe(c)).map((v, i) => (
                  <li key={`${v}-${i}`} className="chip">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
