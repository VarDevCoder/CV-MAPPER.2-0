// Tipos compartidos por toda la aplicación.
// Nada está fijo: los campos se generan a partir de las columnas del archivo.

// Tipo de dato de un campo, inferido de los valores de la columna.
export type TipoCampo = "texto" | "numero" | "email";

// Configuración de un campo dinámico (una por columna del archivo).
export interface CampoDinamico {
  columna: string; // nombre original de la columna (clave en cada registro)
  etiqueta: string; // nombre visible en el formulario (editable)
  tipo: TipoCampo;
  visible: boolean; // si se muestra en la tabla y el formulario
  noNegativo: boolean; // solo para números: exigir valor >= 0
}

// Un registro (fila) del archivo: columna -> valor, todo como texto.
export type Registro = Record<string, string>;

// Una hoja del archivo: encabezados en orden y filas de datos.
export interface Hoja {
  nombre: string;
  encabezados: string[];
  filas: Registro[];
}

// Resultado de importar un archivo. Un CSV produce una sola hoja.
export interface LibroImportado {
  hojas: Hoja[];
}

// Ediciones del usuario por índice de fila (clave como texto por JSON).
export type Ediciones = Record<string, Registro>;

// Filtro de una columna. Se usan solo las claves que aplican a su tipo.
export interface FiltroCampo {
  min?: string; // números: valor mínimo (inclusive)
  max?: string; // números: valor máximo (inclusive)
  valores?: string[]; // listas separadas por coma: valores exigidos
  modo?: "todos" | "alguno"; // listas: exigir todos o al menos uno
  texto?: string; // texto: "contiene"
  correo?: "validos" | "invalidos"; // correos: solo válidos o inválidos
}

// Filtros activos por nombre de columna.
export type Filtros = Record<string, FiltroCampo>;

// Orden de la tabla por una columna.
export interface Orden {
  columna: string;
  direccion: "asc" | "desc";
}
