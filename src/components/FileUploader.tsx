import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { AlertCircle, Check, Database, FileSpreadsheet, Layers, Loader2, Upload } from "lucide-react";
import { parsearArchivo } from "../utils/fileParser";
import type { Hoja, LibroImportado } from "../types";

// Excel de candidatos incluido en public/ para probar la app sin subir nada.
const DATASET_EJEMPLO = "dataset_candidatos_cv.xlsx";

interface Props {
  // Se llama cuando un archivo se parsea correctamente.
  onDatos: (libro: LibroImportado, nombreArchivo: string) => void;
  // Nombre del archivo ya cargado ("" si no hay ninguno).
  nombreArchivo: string;
  // Hojas del archivo cargado y la que está en uso (para el selector).
  hojas: Hoja[];
  hojaActiva: number;
  onCambiarHoja: (indice: number) => void;
}

/**
 * Componente de ingesta: zona para arrastrar y soltar o hacer clic y
 * elegir un archivo .csv o .xlsx. Delega el parseo en parsearArchivo y
 * muestra los errores de forma amigable. Si el Excel tiene varias hojas,
 * muestra un selector.
 */
export function FileUploader({ onDatos, nombreArchivo, hojas, hojaActiva, onCambiarHoja }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [cargando, setCargando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  async function procesar(archivo: File) {
    setError("");
    setCargando(true);
    try {
      const libro = await parsearArchivo(archivo);
      onDatos(libro, archivo.name);
    } catch (err) {
      // Archivo vacío, formato no soportado, sin filas, etc.
      setError(err instanceof Error ? err.message : "Error desconocido al leer el archivo.");
    } finally {
      setCargando(false);
      // Reseteamos el input para permitir resubir el mismo archivo.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // Descarga el Excel de ejemplo publicado junto a la app (carpeta public/)
  // y lo procesa igual que un archivo subido por el usuario.
  async function cargarEjemplo() {
    setError("");
    try {
      const respuesta = await fetch(`/${DATASET_EJEMPLO}`);
      if (!respuesta.ok) {
        throw new Error(`No se pudo descargar el dataset de ejemplo (HTTP ${respuesta.status}).`);
      }
      const blob = await respuesta.blob();
      await procesar(new File([blob], DATASET_EJEMPLO));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el dataset de ejemplo.");
    }
  }

  function manejarInput(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) void procesar(archivo);
  }

  function manejarDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files?.[0];
    if (archivo) void procesar(archivo);
  }

  const hayArchivo = nombreArchivo !== "";
  const hoja = hojas[hojaActiva];
  const resumen = hoja
    ? `${hoja.encabezados.length} columnas, ${hoja.filas.length} filas` +
      (hojas.length > 1 ? ` · ${hojas.length} hojas` : "")
    : "";

  return (
    <section className="tarjeta">
      <h2>
        <span className={`num-seccion${hayArchivo ? " hecho" : ""}`}>{hayArchivo ? <Check size={16} strokeWidth={3} /> : "1"}</span>{" "}
        Subir archivo
      </h2>

      <label
        htmlFor="archivo-input"
        className={`dropzone${arrastrando ? " dropzone-activa" : ""}${hayArchivo ? " dropzone-compacta" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={manejarDrop}
      >
        <input
          ref={inputRef}
          id="archivo-input"
          className="sr-only"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={manejarInput}
          disabled={cargando}
        />

        {cargando ? (
          <span className="dropzone-texto con-icono">
            <Loader2 size={18} className="girando" /> Procesando archivo…
          </span>
        ) : hayArchivo ? (
          <>
            <span className="archivo-icono" aria-hidden="true">
              <FileSpreadsheet size={28} />
            </span>
            <span className="dropzone-texto">
              <strong>{nombreArchivo}</strong>
              {resumen && <span className="ayuda"> · {resumen}</span>}
              <br />
              <span className="ayuda">Arrastrá otro archivo o hacé clic para reemplazarlo</span>
            </span>
          </>
        ) : (
          <>
            <span className="dropzone-icono" aria-hidden="true">
              <Upload size={24} />
            </span>
            <span className="dropzone-texto">
              <strong>Arrastrá tu archivo acá</strong> o <u>hacé clic para elegirlo</u>
              <br />
              <span className="ayuda">Formatos aceptados: .csv (separado por , o ;) y .xlsx</span>
            </span>
          </>
        )}
      </label>

      {hojas.length > 1 && (
        <div className="selector-hoja">
          <label htmlFor="hoja-select" className="con-icono">
            <Layers size={16} /> Hoja del archivo
          </label>
          <select
            id="hoja-select"
            value={hojaActiva}
            onChange={(e) => onCambiarHoja(Number(e.target.value))}
          >
            {hojas.map((h, i) => (
              <option key={`${h.nombre}-${i}`} value={i}>
                {h.nombre} ({h.filas.length} filas, {h.encabezados.length} columnas)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="acciones">
        <button
          type="button"
          className="boton-secundario"
          disabled={cargando}
          onClick={() => void cargarEjemplo()}
        >
          <Database size={16} /> Usar dataset de ejemplo
        </button>
        <span className="ayuda">{DATASET_EJEMPLO} · 10 candidatos</span>
      </div>

      {error && (
        <p className="alerta alerta-error con-icono" role="alert">
          <AlertCircle size={18} /> {error}
        </p>
      )}
    </section>
  );
}
