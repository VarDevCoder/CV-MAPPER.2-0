import { CAMPOS_CV } from "../types";
import type { DatosCV, CampoCV } from "../types";
import { errorDeCampo, contarErrores } from "../utils/validacion";
import { iniciales, listaHabilidades, formatearNumero } from "../utils/formato";

interface Props {
  datos: DatosCV;
  // Valores tal como vienen del archivo, para detectar ediciones.
  original: DatosCV;
  onCambiar: (campo: CampoCV, valor: string) => void;
  // Descarta las ediciones y vuelve a los valores del archivo.
  onRestaurar: () => void;
}

// Texto de ayuda que se muestra debajo de algunos campos.
const AYUDAS: Partial<Record<CampoCV, string>> = {
  habilidades: "Separalas con comas.",
  salarioEsperado: "Solo números, sin puntos ni símbolos.",
};

/**
 * Formulario de CV editable con vista previa en vivo. Valida cada campo
 * (correo con formato válido, años y salario numéricos >= 0) y marca los
 * campos editados respecto del archivo original.
 */
export function CVForm({ datos, original, onCambiar, onRestaurar }: Props) {
  const errores = contarErrores(datos);
  const editado = CAMPOS_CV.some((def) => datos[def.clave] !== original[def.clave]);
  const habilidades = listaHabilidades(datos.habilidades);

  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <span className="num-seccion">4</span> Formulario del candidato
        </h2>
        <div className="insignias">
          {editado && <span className="insignia insignia-info">Editado</span>}
          {errores > 0 ? (
            <span className="insignia insignia-error">
              {errores} error{errores > 1 ? "es" : ""}
            </span>
          ) : (
            <span className="insignia insignia-ok">✓ Válido</span>
          )}
        </div>
      </div>

      <div className="cv-layout">
        {/* Columna izquierda: formulario editable */}
        <form className="formulario" onSubmit={(e) => e.preventDefault()} noValidate>
          {CAMPOS_CV.map((def) => {
            const valor = datos[def.clave];
            const error = errorDeCampo(def.clave, valor);
            const cambiado = valor !== original[def.clave];
            const idAyuda = `cv-${def.clave}-ayuda`;
            const ayuda = error || AYUDAS[def.clave];

            return (
              <div
                key={def.clave}
                className={`campo${def.clave === "habilidades" ? " campo-ancho" : ""}`}
              >
                <label htmlFor={`cv-${def.clave}`}>
                  {def.etiqueta}
                  {cambiado && (
                    <span className="punto-editado" title="Modificado respecto del archivo">
                      ●
                    </span>
                  )}
                </label>
                <input
                  id={`cv-${def.clave}`}
                  // Los numéricos usan texto + inputMode para poder mostrar
                  // el error si el archivo trae algo que no es número.
                  type={def.tipo === "email" ? "email" : "text"}
                  inputMode={def.tipo === "numero" ? "decimal" : undefined}
                  value={valor}
                  className={error ? "input-error" : ""}
                  aria-invalid={error !== ""}
                  aria-describedby={ayuda ? idAyuda : undefined}
                  onChange={(e) => onCambiar(def.clave, e.target.value)}
                />
                {ayuda && (
                  <span id={idAyuda} className={error ? "error" : "ayuda"}>
                    {ayuda}
                  </span>
                )}
              </div>
            );
          })}

          <div className="acciones campo-ancho">
            <button
              type="button"
              className="boton-secundario"
              disabled={!editado}
              onClick={onRestaurar}
            >
              ↺ Restaurar valores del archivo
            </button>
          </div>
        </form>

        {/* Columna derecha: vista previa del CV */}
        <aside className="cv-preview" aria-label="Vista previa del CV">
          <div className="cv-preview-cabecera">
            <span className="avatar avatar-grande" aria-hidden="true">
              {iniciales(datos.nombreCompleto)}
            </span>
            <div>
              <h3>{datos.nombreCompleto || "Sin nombre"}</h3>
              <p className="cv-titulo">{datos.tituloProfesional || "Sin título profesional"}</p>
            </div>
          </div>

          <dl className="cv-datos">
            <dt>Experiencia</dt>
            <dd>
              {datos.anosExperiencia
                ? `${datos.anosExperiencia} año${datos.anosExperiencia === "1" ? "" : "s"}`
                : "—"}
            </dd>
            <dt>Correo</dt>
            <dd>
              {datos.correo && !errorDeCampo("correo", datos.correo) ? (
                <a href={`mailto:${datos.correo}`}>{datos.correo}</a>
              ) : (
                datos.correo || "—"
              )}
            </dd>
            <dt>Salario esperado</dt>
            <dd>{formatearNumero(datos.salarioEsperado) || "—"}</dd>
          </dl>

          <h4>Habilidades</h4>
          {habilidades.length > 0 ? (
            <ul className="chips">
              {habilidades.map((h, i) => (
                <li key={`${h}-${i}`} className="chip">
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ayuda">Sin habilidades cargadas.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
