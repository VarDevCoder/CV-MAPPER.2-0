import { useRef, useState } from "react";
import { parsearArchivo } from "../utils/fileParser";
import type { DatosImportados } from "../types";

interface Props {
  // Se llama cuando un archivo se parsea correctamente.
  onDatos: (datos: DatosImportados, nombreArchivo: string) => void;
}

/**
 * Componente de ingesta: botón para subir un archivo .csv o .xlsx.
 * Delega el parseo en parsearArchivo y reporta errores de forma amigable.
 */
export function FileUploader({ onDatos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [cargando, setCargando] = useState(false);

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setCargando(true);
    try {
      const datos = await parsearArchivo(archivo);
      onDatos(datos, archivo.name);
    } catch (err) {
      // Mostramos el mensaje de error (archivo vacío, formato no soportado, etc.).
      setError(err instanceof Error ? err.message : "Error desconocido al leer el archivo.");
    } finally {
      setCargando(false);
      // Reseteamos el input para permitir resubir el mismo archivo.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="tarjeta">
      <h2>1. Subir archivo de candidatos</h2>
      <p className="ayuda">Formatos aceptados: .csv o .xlsx</p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={manejarArchivo}
        disabled={cargando}
      />

      {cargando && <p className="estado">Procesando archivo…</p>}
      {error && <p className="error">⚠ {error}</p>}
    </section>
  );
}
