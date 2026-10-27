import { ArrowRight, Check, Eye, EyeOff, Pencil, ShieldAlert } from "lucide-react";
import type { CampoDinamico, Hoja, TipoCampo } from "../types";
import { esColumnaSensible } from "../utils/inferencia";

interface Props {
  hoja: Hoja;
  campos: CampoDinamico[];
  // Cambia una o más propiedades del campo en la posición indicada.
  onCambiarCampo: (indice: number, cambios: Partial<CampoDinamico>) => void;
  // Muestra u oculta todos los campos a la vez.
  onCambiarTodos: (visible: boolean) => void;
  // Confirma la configuración (habilitado si hay visibles y etiquetas válidas).
  onConfirmar: () => void;
  // Vuelve a habilitar la edición de la configuración confirmada.
  onEditar: () => void;
  confirmado: boolean;
}

// Cantidad de filas que se muestran en la vista previa del archivo.
const FILAS_PREVIA = 5;

const NOMBRES_TIPO: Record<TipoCampo, string> = {
  texto: "Texto",
  numero: "Número",
  email: "Correo",
};

// Primer valor no vacío de la columna, para mostrar como ejemplo.
function valorEjemplo(hoja: Hoja, columna: string): string {
  return hoja.filas.map((f) => f[columna] ?? "").find((v) => v.trim() !== "") ?? "";
}

/**
 * Configurador de campos: una fila por columna del archivo con su
 * visibilidad, etiqueta, tipo y regla de no negativo. Una vez confirmado,
 * muestra un resumen de los campos visibles.
 */
export function FieldConfigurator({
  hoja,
  campos,
  onCambiarCampo,
  onCambiarTodos,
  onConfirmar,
  onEditar,
  confirmado,
}: Props) {
  const visibles = campos.filter((c) => c.visible);
  const etiquetasVacias = campos.filter((c) => c.etiqueta.trim() === "").length;
  const puedeConfirmar = visibles.length > 0 && etiquetasVacias === 0;
  const sensibles = campos.filter((c) => esColumnaSensible(c.columna));

  // Vista resumida una vez confirmada la configuración.
  if (confirmado) {
    return (
      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <span className="num-seccion hecho">
              <Check size={16} strokeWidth={3} />
            </span>{" "}
            Campos configurados
          </h2>
          <button className="boton-secundario" onClick={onEditar}>
            <Pencil size={15} /> Editar campos
          </button>
        </div>
        <p className="ayuda">
          {visibles.length} de {campos.length} columnas visibles.
        </p>
        <ul className="resumen-campos">
          {visibles.map((c) => (
            <li key={c.columna}>
              <strong>{c.etiqueta}</strong>
              <span className="tipo-tag">
                {NOMBRES_TIPO[c.tipo]}
                {c.tipo === "numero" && c.noNegativo ? " ≥ 0" : ""}
              </span>
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
          <span className="num-seccion">2</span> Configurar campos
        </h2>
        <span className={`contador${visibles.length > 0 ? " contador-ok" : ""}`}>
          {visibles.length} de {campos.length} visibles
        </span>
      </div>
      <p className="ayuda">
        Cada columna del archivo es un campo. Elegí cuáles mostrar, cómo se llaman
        y qué tipo de dato tienen (el tipo se infirió de los valores).
      </p>

      {sensibles.length > 0 && (
        <p className="alerta alerta-aviso con-icono" role="note">
          <ShieldAlert size={18} />
          <span>
            {sensibles.map((c) => `"${c.columna}"`).join(", ")}{" "}
            {sensibles.length === 1 ? "parece un dato personal sensible" : "parecen datos personales sensibles"}{" "}
            (raza, origen, religión, género, edad…). No se ofrecen para filtrar ni ordenar; si
            no los necesitás, ocultalos.
          </span>
        </p>
      )}

      <div className="acciones acciones-compactas">
        <button type="button" className="boton-secundario" onClick={() => onCambiarTodos(true)}>
          <Eye size={15} /> Mostrar todos
        </button>
        <button type="button" className="boton-secundario" onClick={() => onCambiarTodos(false)}>
          <EyeOff size={15} /> Ocultar todos
        </button>
      </div>

      <div className="tabla-scroll">
        <table className="tabla-config">
          <thead>
            <tr>
              <th>Mostrar</th>
              <th>Columna original</th>
              <th>Etiqueta</th>
              <th>Tipo</th>
              <th>No negativo</th>
              <th>Ejemplo</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((c, i) => {
              const etiquetaVacia = c.etiqueta.trim() === "";
              const ejemplo = valorEjemplo(hoja, c.columna);
              return (
                <tr key={c.columna} className={c.visible ? "" : "fila-oculta"}>
                  <td className="celda-centro">
                    <input
                      type="checkbox"
                      checked={c.visible}
                      aria-label={`Mostrar ${c.columna}`}
                      onChange={(e) => onCambiarCampo(i, { visible: e.target.checked })}
                    />
                  </td>
                  <td>
                    <code className="columna-tag">{c.columna}</code>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={c.etiqueta}
                      aria-label={`Etiqueta de ${c.columna}`}
                      aria-invalid={etiquetaVacia}
                      className={etiquetaVacia ? "input-error" : ""}
                      onChange={(e) => onCambiarCampo(i, { etiqueta: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={c.tipo}
                      aria-label={`Tipo de ${c.columna}`}
                      onChange={(e) => onCambiarCampo(i, { tipo: e.target.value as TipoCampo })}
                    >
                      {(Object.keys(NOMBRES_TIPO) as TipoCampo[]).map((t) => (
                        <option key={t} value={t}>
                          {NOMBRES_TIPO[t]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="celda-centro">
                    <input
                      type="checkbox"
                      checked={c.tipo === "numero" && c.noNegativo}
                      disabled={c.tipo !== "numero"}
                      aria-label={`No negativo en ${c.columna}`}
                      onChange={(e) => onCambiarCampo(i, { noNegativo: e.target.checked })}
                    />
                  </td>
                  <td className="celda-ejemplo" title={ejemplo}>
                    {ejemplo || <em className="ayuda">(vacío)</em>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="vista-previa">
        <summary>
          Ver las primeras {Math.min(FILAS_PREVIA, hoja.filas.length)} filas del archivo
        </summary>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                {hoja.encabezados.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hoja.filas.slice(0, FILAS_PREVIA).map((fila, i) => (
                <tr key={i}>
                  {hoja.encabezados.map((col) => (
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
          Confirmar campos <ArrowRight size={16} />
        </button>
        {!puedeConfirmar && (
          <span className="ayuda">
            {visibles.length === 0
              ? "Elegí al menos un campo para mostrar."
              : `Hay ${etiquetasVacias} etiqueta(s) vacía(s).`}
          </span>
        )}
      </div>
    </section>
  );
}
