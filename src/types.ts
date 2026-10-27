// Tipos compartidos por toda la aplicación.

// Claves internas de cada campo del formulario de CV.
export type CampoCV =
  | "nombreCompleto"
  | "tituloProfesional"
  | "anosExperiencia"
  | "habilidades"
  | "correo"
  | "salarioEsperado";

// Definición de un campo del CV: su clave interna, la etiqueta visible
// y el tipo de dato esperado (para validar).
export interface DefinicionCampo {
  clave: CampoCV;
  etiqueta: string;
  tipo: "texto" | "numero" | "email";
}

// Catálogo de los 6 campos del formulario, en el orden en que se muestran.
export const CAMPOS_CV: DefinicionCampo[] = [
  { clave: "nombreCompleto", etiqueta: "Nombre completo", tipo: "texto" },
  { clave: "tituloProfesional", etiqueta: "Título profesional", tipo: "texto" },
  { clave: "anosExperiencia", etiqueta: "Años de experiencia", tipo: "numero" },
  { clave: "habilidades", etiqueta: "Habilidades", tipo: "texto" },
  { clave: "correo", etiqueta: "Correo", tipo: "email" },
  { clave: "salarioEsperado", etiqueta: "Salario esperado", tipo: "numero" },
];

// Una fila del archivo importado: columna -> valor (todo como texto).
export type FilaArchivo = Record<string, string>;

// Resultado de parsear un archivo: encabezados y filas.
export interface DatosImportados {
  encabezados: string[];
  filas: FilaArchivo[];
}

// Mapeo campo del CV -> nombre de columna del archivo ("" = sin mapear).
export type Mapeo = Record<CampoCV, string>;

// Valores del formulario de CV (siempre como texto para poder editarlos).
export type DatosCV = Record<CampoCV, string>;

// Mapeo vacío inicial.
export const MAPEO_VACIO: Mapeo = {
  nombreCompleto: "",
  tituloProfesional: "",
  anosExperiencia: "",
  habilidades: "",
  correo: "",
  salarioEsperado: "",
};

// Formulario de CV vacío inicial.
export const CV_VACIO: DatosCV = {
  nombreCompleto: "",
  tituloProfesional: "",
  anosExperiencia: "",
  habilidades: "",
  correo: "",
  salarioEsperado: "",
};
