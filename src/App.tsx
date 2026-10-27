import { useEffect } from "react";
import { Stepper } from "./components/Stepper";
import { FileUploader } from "./components/FileUploader";
import { ColumnMapper } from "./components/ColumnMapper";
import { CandidateSelector } from "./components/CandidateSelector";
import { CVForm } from "./components/CVForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { autosugerirMapeo, filaACV } from "./utils/mapping";
import { CV_VACIO, MAPEO_VACIO } from "./types";
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

  // Fila del candidato elegido (null si no hay o si el índice guardado
  // ya no existe, por ejemplo con un localStorage inconsistente).
  const filaElegida =
    datos && seleccionado !== null ? (datos.filas[seleccionado] ?? null) : null;
  const original = filaElegida ? filaACV(filaElegida, mapeo) : null;

  // Paso actual del flujo, para el indicador de progreso.
  const pasoActual = !datos ? 1 : !confirmado ? 2 : !original ? 3 : 4;

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

  // Al confirmar, si ya había un candidato elegido, lo recargamos con el
  // nuevo mapeo (las columnas pueden haber cambiado).
  function confirmarMapeo() {
    setConfirmado(true);
    if (filaElegida) setFormulario(filaACV(filaElegida, mapeo));
  }

  function editarMapeo() {
    setConfirmado(false);
  }

  // Al elegir un candidato, volcamos su fila al formulario según el mapeo.
  function seleccionarCandidato(indice: number) {
    if (!datos) return;
    const fila = datos.filas[indice];
    if (!fila) return;
    setSeleccionado(indice);
    setFormulario(filaACV(fila, mapeo));
  }

  function cambiarFormulario(campo: CampoCV, valor: string) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  function restaurarFormulario() {
    if (original) setFormulario(original);
  }

  // Limpia TODO el estado persistido, previa confirmación del usuario.
  function limpiarDatos() {
    const ok = window.confirm(
      "¿Borrar el archivo importado, el mapeo y las ediciones guardadas en este navegador?"
    );
    if (!ok) return;
    setDatos(null);
    setNombreArchivo("");
    setMapeo(MAPEO_VACIO);
    setConfirmado(false);
    setSeleccionado(null);
    setFormulario(CV_VACIO);
  }

  return (
    <div className="contenedor">
      <header className="cabecera">
        <div>
          <h1>Importador de CVs</h1>
          <p className="ayuda">
            Subí un archivo de candidatos, asociá sus columnas con los campos del
            CV y editá los datos.
          </p>
        </div>
        {datos && (
          <button className="boton-peligro" onClick={limpiarDatos}>
            🗑 Limpiar datos
          </button>
        )}
      </header>

      <Stepper pasoActual={pasoActual} />

      <FileUploader
        onDatos={manejarDatos}
        nombreArchivo={datos ? nombreArchivo : ""}
        resumen={
          datos ? `${datos.encabezados.length} columnas, ${datos.filas.length} filas` : undefined
        }
      />

      {datos && (
        <ColumnMapper
          encabezados={datos.encabezados}
          filas={datos.filas}
          mapeo={mapeo}
          onCambiar={cambiarMapeo}
          onConfirmar={confirmarMapeo}
          onEditar={editarMapeo}
          confirmado={confirmado}
        />
      )}

      {datos && confirmado && (
        <CandidateSelector
          datos={datos}
          mapeo={mapeo}
          indiceSeleccionado={original ? seleccionado : null}
          onSeleccionar={seleccionarCandidato}
        />
      )}

      {confirmado && original && (
        <CVForm
          datos={formulario}
          original={original}
          onCambiar={cambiarFormulario}
          onRestaurar={restaurarFormulario}
        />
      )}

      <footer className="pie">
        💾 Los cambios se guardan automáticamente en este navegador.
      </footer>
    </div>
  );
}
