import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { parsearArchivo } from "../utils/fileParser";
import type { DatosImportados } from "../types";

interface Props {
  // Se llama cuando un archivo se parsea correctamente.
  onDatos: (datos: DatosImportados, nombreArchivo: string) => void;
  // Nombre del archivo ya cargado ("" si no hay ninguno).
  nombreArchivo: string;
  // Resumen del archivo cargado (columnas y filas), si existe.
  resumen?: string;
}

/**
 * Componente de ingesta: zona para arrastrar y soltar o hacer clic y
 * elegir un archivo .csv o .xlsx. Delega el parseo en parsearArchivo y
 * muestra los errores de forma amigable.
 */
export function FileUploader({ onDatos, nombreArchivo, resumen }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [cargando, setCargando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  async function procesar(archivo: File) {
    setError("");
    setCargando(true);
    try {
      const datos = await parsearArchivo(archivo);
      onDatos(datos, archivo.name);
    } catch (err) {
      // Archivo vacío, formato no soportado, sin filas, etc.
      setError(err instanceof Error ? err.message : "Error desconocido al leer el archivo.");
    } finally {
      setCargando(false);
      // Reseteamos el input para permitir resubir el mismo archivo.
      if (inputRef.current) inputRef.current.value = "";
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

  return (
    <section className="tarjeta">
      <h2>
        <span className="num-seccion">1</span> Subir archivo de candidatos
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
          <span className="dropzone-texto">⏳ Procesando archivo…</span>
        ) : hayArchivo ? (
          <>
            <span className="archivo-icono" aria-hidden="true">📄</span>
            <span className="dropzone-texto">
              <strong>{nombreArchivo}</strong>
              {resumen && <span className="ayuda"> · {resumen}</span>}
              <br />
              <span className="ayuda">Arrastrá otro archivo o hacé clic para reemplazarlo</span>
            </span>
          </>
        ) : (
          <>
            <span className="dropzone-icono" aria-hidden="true">⬆</span>
            <span className="dropzone-texto">
              <strong>Arrastrá tu archivo acá</strong> o <u>hacé clic para elegirlo</u>
              <br />
              <span className="ayuda">Formatos aceptados: .csv (separado por , o ;) y .xlsx</span>
            </span>
          </>
        )}
      </label>

      {error && (
        <p className="alerta alerta-error" role="alert">
          ⚠ {error}
        </p>
      )}
    </section>
  );
}
