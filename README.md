# Importador de tablas con campos dinámicos

Aplicación web (sin backend) que importa un archivo `.xlsx` o `.csv` y **genera
los campos a partir de sus columnas**: cada columna se convierte en un campo
que se puede configurar, ver en una tabla, editar en un formulario y exportar.
No hay campos fijos, así que sirve para cualquier tabla. Todo se guarda en
`localStorage`.

Stack: **Vite + React 18 + TypeScript**, PapaParse (CSV) y SheetJS/xlsx (Excel).
Sin librerías de UI.

## Flujo

1. **Subir archivo**: `.xlsx` o `.csv` (separador `,` o `;` autodetectado,
   UTF-8), arrastrando o eligiendo el archivo. El botón *Usar dataset de
   ejemplo* carga `public/dataset_candidatos_cv.xlsx`. Si el Excel tiene
   varias hojas con datos, aparece un selector de hoja.
2. **Configurar campos**: una fila por columna con *Mostrar*, nombre original,
   etiqueta editable, tipo (texto / número / correo), *No negativo* (solo
   números) y un valor de ejemplo. El tipo se infiere de los valores y del
   nombre de la columna. *Confirmar* se deshabilita si no hay campos visibles
   o si alguna etiqueta está vacía. Incluye una vista previa de las primeras
   filas.
3. **Tabla de registros**: columnas visibles, buscador en todas ellas,
   paginación de 25 filas, marca de filas editadas, celdas inválidas en rojo,
   selección con clic o teclado (Enter / Espacio). *Descargar CSV* y
   *Descargar Excel* exportan con las ediciones aplicadas y las etiquetas como
   encabezados.
4. **Formulario del registro**: un input por campo visible según su tipo,
   tarjeta de vista previa, indicadores de *Editado* y de errores,
   *Restaurar valores del archivo* y *Anterior* / *Siguiente*.

## Inferencia de tipos

- **Número**: al menos el 80 % de los valores no vacíos son numéricos, o el
  50 % si el nombre sugiere número (años, experiencia, salario, sueldo, monto,
  edad, precio, cantidad, total, importe).
- **Correo**: mismo criterio con formato de correo (50 % si el nombre contiene
  *mail* o *correo*).
- **Texto**: el resto.
- *No negativo* se activa si el nombre sugiere número o si todos los valores
  son `>= 0`.

Los nombres se comparan sin acentos. La etiqueta inicial reemplaza `_` por
espacios y pone la primera letra en mayúscula.

## Validaciones

- Correo: formato válido.
- Número: número válido (punto decimal) y, con *No negativo*, `>= 0`.
- Un valor vacío nunca es error.

## Persistencia y manejo de errores

- Se guardan con el prefijo `tablaapp.v2.`: archivo importado, nombre, hoja
  activa, campos, confirmación, fila elegida y ediciones (por índice de fila).
- Archivo vacío, sin filas de datos o con formato no soportado: mensaje claro.
- JSON corrupto o inconsistente en `localStorage`: la app vuelve a inferir
  los campos o descarta el dato sin romperse.
- Al cambiar de archivo o de hoja se reinician campos, selección y ediciones
  (si hay ediciones, se pide confirmación).

## Requisitos

- Node.js 18 o superior.

## Pasos de ejecución

```bash
npm install
npm run dev
```

Luego abrí la URL que muestra Vite (por defecto http://localhost:5173).

Para una build de producción:

```bash
npm run build
npm run preview
```

## Dataset de ejemplo

`dataset_candidatos_cv.xlsx` (10 filas, hoja "Candidatos CV"), con las columnas
`id_candidato`, `nombre_completo`, `titulo_profesional`, `anos_experiencia`,
`habilidades_principales`, `correo_electronico` y `salario_esperado_usd`.
Está en la raíz y en `public/` (para el botón de ejemplo).
`dataset_candidatos_cv.csv` tiene los mismos datos con `;` como separador.

En `pruebas/` hay archivos para cada caso (ver `pruebas/README.md`).

## Estructura del proyecto

```
cv-mapper/
├── index.html
├── package.json
├── netlify.toml
├── public/
│   └── dataset_candidatos_cv.xlsx
├── pruebas/                     # Archivos para probar casos y errores
└── src/
    ├── main.tsx
    ├── App.tsx                  # Estado persistido y flujo completo
    ├── index.css
    ├── types.ts                 # Modelo dinámico (campos, registros, hojas)
    ├── hooks/
    │   └── useLocalStorage.ts
    ├── utils/
    │   ├── fileParser.ts        # PapaParse (CSV) + SheetJS (Excel, todas las hojas)
    │   ├── inferencia.ts        # Tipos y etiquetas a partir de las columnas
    │   ├── validacion.ts        # Validación genérica por tipo
    │   ├── exportar.ts          # Descarga CSV / Excel
    │   └── formato.ts
    └── components/
        ├── Stepper.tsx
        ├── FileUploader.tsx
        ├── FieldConfigurator.tsx
        ├── RecordTable.tsx
        └── RecordForm.tsx
```
