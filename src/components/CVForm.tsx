import { CAMPOS_CV } from "../types";
import type { DatosCV, CampoCV } from "../types";

interface Props {
  datos: DatosCV;
  onCambiar: (campo: CampoCV, valor: string) => void;
}

// Valida el correo con una expresión regular simple pero suficiente.
function correoValido(correo: string): boolean {
  if (correo.trim() === "") return true; // vacío no se marca como error aquí
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

// Valida que un número sea >= 0. Acepta vacío sin marcar error.
function numeroNoNegativo(valor: string): boolean {
  if (valor.trim() === "") return true;
  const n = Number(valor);
  return !Number.isNaN(n) && n >= 0;
}

// Devuelve el mensaje de error de un campo, o "" si es válido.
function errorDeCampo(campo: CampoCV, valor: string): string {
  if (campo === "correo" && !correoValido(valor)) {
    return "Correo con formato inválido.";
  }
  if (
    (campo === "anosExperiencia" || campo === "salarioEsperado") &&
    !numeroNoNegativo(valor)
  ) {
    return "Debe ser un número mayor o igual a 0.";
  }
  return "";
}

/**
 * Formulario de CV editable. Rellena sus campos desde `datos` y reporta
 * cada cambio con `onCambiar`. Muestra validaciones por campo:
 * correo con formato válido, y años/salario numéricos >= 0.
 */
export function CVForm({ datos, onCambiar }: Props) {
  return (
    <section className="tarjeta">
      <h2>4. Formulario del candidato</h2>
      <form className="formulario" onSubmit={(e) => e.preventDefault()}>
        {CAMPOS_CV.map((def) => {
          const valor = datos[def.clave];
          const error = errorDeCampo(def.clave, valor);
          // Los campos numéricos usan input number; el resto, texto/email.
          const tipoInput =
            def.tipo === "numero" ? "number" : def.tipo === "email" ? "email" : "text";

          return (
            <div key={def.clave} className="campo">
              <label htmlFor={`cv-${def.clave}`}>{def.etiqueta}</label>
              <input
                id={`cv-${def.clave}`}
                type={tipoInput}
                min={def.tipo === "numero" ? 0 : undefined}
                value={valor}
                className={error ? "input-error" : ""}
                onChange={(e) => onCambiar(def.clave, e.target.value)}
              />
              {error && <span className="error">{error}</span>}
            </div>
          );
        })}
      </form>
    </section>
  );
}
