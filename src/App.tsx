import { useEffect, useMemo } from "react";
import { Save, Table2, Trash2 } from "lucide-react";
import { Stepper } from "./components/Stepper";
import { FileUploader } from "./components/FileUploader";
import { FieldConfigurator } from "./components/FieldConfigurator";
import { RecordTable } from "./components/RecordTable";
import { RecordForm } from "./components/RecordForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { inferirCampos } from "./utils/inferencia";
import { descargarCSV, descargarExcel } from "./utils/exportar";
import type { CampoDinamico, Ediciones, Hoja, LibroImportado, Registro } from "./types";

// Claves de localStorage agrupadas en un solo lugar. El prefijo v2 evita
// leer datos guardados por la versión anterior (campos fijos de CV).
const CLAVES = {
  libro: "tablaapp.v2.libro",
  nombreArchivo: "tablaapp.v2.nombreArchivo",
  hojaActiva: "tablaapp.v2.hojaActiva",
  campos: "tablaapp.v2.campos",
  confirmado: "tablaapp.v2.confirmado",
  seleccionado: "tablaapp.v2.seleccionado",
  ediciones: "tablaapp.v2.ediciones",
};

const TIPOS_VALIDOS = ["texto", "numero", "email"];

// --- Defensas contra un localStorage inconsistente o editado a mano ---

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// El libro sirve solo si tiene un array de hojas con encabezados y filas.
function libroValido(valor: unknown): LibroImportado | null {
  if (!esObjeto(valor) || !Array.isArray(valor.hojas) || valor.hojas.length === 0) return null;
  const hojasOk = valor.hojas.every(
    (h: unknown) =>
      esObjeto(h) && typeof h.nombre === "string" && Array.isArray(h.encabezados) && Array.isArray(h.filas)
  );
  return hojasOk ? (valor as unknown as LibroImportado) : null;
}

// Los campos sirven solo si corresponden, en orden, a las columnas de la hoja.
function camposCoinciden(campos: unknown, hoja: Hoja): campos is CampoDinamico[] {
  return (
    Array.isArray(campos) &&
    campos.length === hoja.encabezados.length &&
    campos.every(
      (c: unknown, i) =>
        esObjeto(c) &&
        c.columna === hoja.encabezados[i] &&
        typeof c.etiqueta === "string" &&
        TIPOS_VALIDOS.includes(c.tipo as string) &&
        typeof c.visible === "boolean" &&
        typeof c.noNegativo === "boolean"
    )
  );
}

export default function App() {
  // --- Estado persistido en localStorage ---
  const [libroGuardado, setLibro] = useLocalStorage<LibroImportado | null>(CLAVES.libro, null);
  const [nombreArchivo, setNombreArchivo] = useLocalStorage<string>(CLAVES.nombreArchivo, "");
  const [hojaGuardada, setHojaActiva] = useLocalStorage<number>(CLAVES.hojaActiva, 0);
  const [camposGuardados, setCampos] = useLocalStorage<CampoDinamico[]>(CLAVES.campos, []);
  const [confirmado, setConfirmado] = useLocalStorage<boolean>(CLAVES.confirmado, false);
  const [seleccionadoGuardado, setSeleccionado] = useLocalStorage<number | null>(
    CLAVES.seleccionado,
    null
  );
  const [edicionesGuardadas, setEdiciones] = useLocalStorage<Ediciones>(CLAVES.ediciones, {});

  // --- Valores saneados (nunca confiamos en lo que vino del storage) ---
  const libro = libroValido(libroGuardado);
  const hojas = libro ? libro.hojas : [];
  const hojaActiva =
    Number.isInteger(hojaGuardada) && hojaGuardada >= 0 && hojaGuardada < hojas.length ? hojaGuardada : 0;
  const hoja: Hoja | null = hojas[hojaActiva] ?? null;

  const coinciden = hoja !== null && camposCoinciden(camposGuardados, hoja);
  const camposInferidos = useMemo(() => (hoja ? inferirCampos(hoja) : []), [hoja]);
  const campos = coinciden ? camposGuardados : camposInferidos;
  const camposVisibles = campos.filter((c) => c.visible);

  const ediciones: Ediciones = esObjeto(edicionesGuardadas) ? edicionesGuardadas : {};
  const totalFilas = hoja ? hoja.filas.length : 0;
  const seleccionado =
    typeof seleccionadoGuardado === "number" &&
    Number.isInteger(seleccionadoGuardado) &&
    seleccionadoGuardado >= 0 &&
    seleccionadoGuardado < totalFilas
      ? seleccionadoGuardado
      : null;

  // Si los campos guardados no corresponden a la hoja, persistimos los inferidos.
  useEffect(() => {
    if (hoja && !coinciden) setCampos(camposInferidos);
  }, [hoja, coinciden, camposInferidos, setCampos]);

  // Valor mostrado de cada fila: la edición si existe, si no la del archivo.
  function registroActual(indice: number): Registro {
    const fila = hoja?.filas[indice] ?? {};
    const editado = ediciones[String(indice)];
    return esObjeto(editado) ? { ...fila, ...editado } : fila;
  }

  const registros = hoja ? hoja.filas.map((_, i) => registroActual(i)) : [];
  const editadas = new Set(
    Object.keys(ediciones)
      .map(Number)
      .filter((i) => Number.isInteger(i) && i >= 0 && i < totalFilas)
  );

  // Paso actual del flujo, para el indicador de progreso.
  const pasoActual = !hoja ? 1 : !confirmado ? 2 : seleccionado === null ? 3 : 4;

  // --- Handlers ---

  // Al cambiar de hoja o de archivo se pierden las ediciones: avisamos.
  function aceptaPerderEdiciones(): boolean {
    if (editadas.size === 0) return true;
    return window.confirm(
      `Hay ${editadas.size} fila(s) editada(s). Si continuás se descartan esas ediciones. ¿Continuar?`
    );
  }

  // Reinicia todo lo que depende de la hoja en uso.
  function usarHoja(nuevaHoja: Hoja, indice: number) {
    setHojaActiva(indice);
    setCampos(inferirCampos(nuevaHoja));
    setConfirmado(false);
    setSeleccionado(null);
    setEdiciones({});
  }

  function manejarDatos(nuevo: LibroImportado, nombre: string) {
    if (!aceptaPerderEdiciones()) return;
    setLibro(nuevo);
    setNombreArchivo(nombre);
    usarHoja(nuevo.hojas[0], 0);
  }

  function cambiarHoja(indice: number) {
    const nueva = hojas[indice];
    if (!nueva || indice === hojaActiva) return;
    if (!aceptaPerderEdiciones()) return;
    usarHoja(nueva, indice);
  }

  function cambiarCampo(indice: number, cambios: Partial<CampoDinamico>) {
    setCampos(campos.map((c, i) => (i === indice ? { ...c, ...cambios } : c)));
  }

  function cambiarTodos(visible: boolean) {
    setCampos(campos.map((c) => ({ ...c, visible })));
  }

  function seleccionar(indice: number) {
    if (indice >= 0 && indice < totalFilas) setSeleccionado(indice);
  }

  // Guarda la edición de un valor. Si la fila vuelve a ser igual a la del
  // archivo, se quita de las ediciones para que deje de marcarse.
  function cambiarValor(columna: string, valor: string) {
    if (!hoja || seleccionado === null) return;
    const original = hoja.filas[seleccionado];
    const nuevo = { ...registroActual(seleccionado), [columna]: valor };
    const igualAlArchivo = hoja.encabezados.every((col) => (nuevo[col] ?? "") === (original[col] ?? ""));
    const clave = String(seleccionado);
    setEdiciones((prev) => {
      const siguiente = { ...(esObjeto(prev) ? prev : {}) };
      if (igualAlArchivo) delete siguiente[clave];
      else siguiente[clave] = nuevo;
      return siguiente;
    });
  }

  function restaurarRegistro() {
    if (seleccionado === null) return;
    const clave = String(seleccionado);
    setEdiciones((prev) => {
      const siguiente = { ...(esObjeto(prev) ? prev : {}) };
      delete siguiente[clave];
      return siguiente;
    });
  }

  // Limpia TODO el estado persistido, previa confirmación del usuario.
  function limpiarDatos() {
    const ok = window.confirm(
      "¿Borrar el archivo importado, la configuración de campos y las ediciones guardadas en este navegador?"
    );
    if (!ok) return;
    setLibro(null);
    setNombreArchivo("");
    setHojaActiva(0);
    setCampos([]);
    setConfirmado(false);
    setSeleccionado(null);
    setEdiciones({});
  }

  return (
    <div className="contenedor">
      <header className="cabecera">
        <div>
          <h1 className="con-icono">
            <Table2 size={28} className="icono-marca" aria-hidden="true" /> Importador de tablas
          </h1>
          <p className="ayuda">
            Subí un archivo .xlsx o .csv: cada columna se convierte en un campo que
            podés configurar, ver en una tabla y editar.
          </p>
        </div>
        {hoja && (
          <button className="boton-peligro" onClick={limpiarDatos}>
            <Trash2 size={16} /> Limpiar datos
          </button>
        )}
      </header>

      <Stepper pasoActual={pasoActual} />

      <FileUploader
        onDatos={manejarDatos}
        nombreArchivo={hoja ? nombreArchivo : ""}
        hojas={hojas}
        hojaActiva={hojaActiva}
        onCambiarHoja={cambiarHoja}
      />

      {hoja && (
        <FieldConfigurator
          hoja={hoja}
          campos={campos}
          onCambiarCampo={cambiarCampo}
          onCambiarTodos={cambiarTodos}
          onConfirmar={() => setConfirmado(true)}
          onEditar={() => setConfirmado(false)}
          confirmado={confirmado && camposVisibles.length > 0}
        />
      )}

      {hoja && confirmado && camposVisibles.length > 0 && (
        <RecordTable
          campos={camposVisibles}
          registros={registros}
          editadas={editadas}
          indiceSeleccionado={seleccionado}
          onSeleccionar={seleccionar}
          onDescargarCSV={() => descargarCSV(nombreArchivo, camposVisibles, registros)}
          onDescargarExcel={() => descargarExcel(nombreArchivo, hoja.nombre, camposVisibles, registros)}
        />
      )}

      {hoja && confirmado && camposVisibles.length > 0 && seleccionado !== null && (
        <RecordForm
          campos={camposVisibles}
          hoja={hoja}
          registro={registros[seleccionado]}
          original={hoja.filas[seleccionado]}
          indice={seleccionado}
          total={totalFilas}
          onCambiar={cambiarValor}
          onRestaurar={restaurarRegistro}
          onAnterior={() => seleccionar(seleccionado - 1)}
          onSiguiente={() => seleccionar(seleccionado + 1)}
        />
      )}

      <footer className="pie con-icono">
        <Save size={14} /> Los cambios se guardan automáticamente en este navegador.
      </footer>
    </div>
  );
}
