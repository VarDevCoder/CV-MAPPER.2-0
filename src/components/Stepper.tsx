// Nombres de los 4 pasos del flujo, en orden.
const PASOS = ["Subir archivo", "Configurar campos", "Tabla de registros", "Editar registro"];

interface Props {
  // Paso actual (1 a 4). Los anteriores se muestran como completados.
  pasoActual: number;
}

/**
 * Indicador de progreso: muestra en qué paso del flujo está el usuario.
 */
export function Stepper({ pasoActual }: Props) {
  return (
    <ol className="stepper" aria-label="Progreso">
      {PASOS.map((texto, i) => {
        const numero = i + 1;
        const estado =
          numero < pasoActual ? "hecho" : numero === pasoActual ? "actual" : "pendiente";
        return (
          <li
            key={texto}
            className={`paso paso-${estado}`}
            aria-current={estado === "actual" ? "step" : undefined}
          >
            <span className="paso-num">{estado === "hecho" ? "✓" : numero}</span>
            <span className="paso-texto">{texto}</span>
          </li>
        );
      })}
    </ol>
  );
}
