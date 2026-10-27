import { useEffect } from "react";
import { FileUploader } from "./components/FileUploader";
import { ColumnMapper } from "./components/ColumnMapper";
import { CandidateSelector } from "./components/CandidateSelector";
import { CVForm } from "./components/CVForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { autosugerirMapeo } from "./utils/mapping";
import {
  CV_VACIO,
  MAPEO_VACIO,
  CAMPOS_CV,
} from "./types";
import type { DatosImportados, Mapeo, DatosCV, CampoCV } from "./types";

// Claves de localStorage agrupadas en un solo lugar.
const CLAVES = {
  datos: "cvmapper.datos",
  nombreArchivo: "cvmapper.nombreArchivo",
  mapeo: "cvmapper.mapeo",
  confirmado: "cvmapper.confirmado",
  seleccionado: "cvmapper.seleccionado",
  formulario: "cvmapper.formulario",
};

export default function App() {
  // --- Estado persistido en localStorage ---
  const [datos, setDatos] = useLocalStorage<DatosImportados | null>(CLAVES.datos, null);
  const [nombreArchivo, setNombreArchivo] = useLocalStorage<string>(CLAVES.nombreArchivo, "");
  const [mapeo, setMapeo] = useLocalStorage<Mapeo>(CLAVES.mapeo, MAPEO_VACIO);
  const [confirmado, setConfirmado] = useLocalStorage<boolean>(CLAVES.confirmado, false);
  const [seleccionado, setSeleccionado] = useLocalStorage<number | null>(CLAVES.seleccionado, null);
  const [formulario, setFormulario] = useLocalStorage<DatosCV>(CLAVES.formulario, CV_VACIO);

  // Si hay datos pero el mapeo está completamente vacío, autosugerimos uno.
  // Cubre el caso de recargar con datos importados sin mapeo previo.
  useEffect(() => {
    if (datos && Object.values(mapeo).every((v) => v === "")) {
      setMapeo(autosugerirMapeo(datos.encabezados));
    }
  }, [datos, mapeo, setMapeo]);

  // --- Handlers ---

  // Al recibir un archivo parseado: guardamos datos y autosugerimos el mapeo.
  function manejarDatos(nuevos: DatosImportados, nombre: string) {
    setDatos(nuevos);
    setNombreArchivo(nombre);
    setMapeo(autosugerirMapeo(nuevos.encabezados));
    setConfirmado(false);
    setSeleccionado(null);
    setFormulario(CV_VACIO);
  }

  function cambiarMapeo(campo: CampoCV, columna: string) {
    setMapeo((prev) => ({ ...prev, [campo]: columna }));
  }

  function confirmarMapeo() {
    setConfirmado(true);
  }

  // Al elegir un candidato, volcamos su fila al formulario según el mapeo.
  function seleccionarCandidato(indice: number) {
    if (!datos) return;
    const fila = datos.filas[indice];
    const nuevo: DatosCV = { ...CV_VACIO };
    for (const def of CAMPOS_CV) {
      const columna = mapeo[def.clave];
      nuevo[def.clave] = columna ? (fila[columna] ?? "") : "";
    }
    setSeleccionado(indice);
    setFormulario(nuevo);
  }

  function cambiarFormulario(campo: CampoCV, valor: string) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  // Limpia TODO el estado persistido y vuelve al punto de partida.
  function limpiarDatos() {
    setDatos(null);
    setNombreArchivo("");
    setMapeo(MAPEO_VACIO);
    setConfirmado(false);
    setSeleccionado(null);
    setFormulario(CV_VACIO);
  }

  return (
    <div className="contenedor">
      <header>
        <h1>Importador de CVs con mapeo de columnas</h1>
        <p className="ayuda">
          Subí un archivo de candidatos, asociá sus columnas con los campos del
          CV y editá los datos. Todo se guarda en tu navegador.
        </p>
      </header>

      <FileUploader onDatos={manejarDatos} />

      {datos && (
        <>
          <p className="estado">
            Archivo cargado: <strong>{nombreArchivo}</strong> — {datos.encabezados.length}{" "}
            columnas, {datos.filas.length} filas.
          </p>

          <ColumnMapper
            encabezados={datos.encabezados}
            mapeo={mapeo}
            onCambiar={cambiarMapeo}
            onConfirmar={confirmarMapeo}
            confirmado={confirmado}
          />

          {confirmado && (
            <CandidateSelector
              datos={datos}
              mapeo={mapeo}
              indiceSeleccionado={seleccionado}
              onSeleccionar={seleccionarCandidato}
            />
          )}

          {confirmado && seleccionado !== null && (
            <CVForm datos={formulario} onCambiar={cambiarFormulario} />
          )}
        </>
      )}

      <section className="tarjeta">
        <button className="boton-peligro" onClick={limpiarDatos}>
          Limpiar datos
        </button>
      </section>
    </div>
  );
}
