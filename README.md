# Importador de CVs con mapeo de columnas

Aplicación web (sin backend) que importa un archivo de candidatos (`.csv` o
`.xlsx`), permite **mapear las columnas del archivo con los campos de un
formulario de CV**, rellena el formulario con el candidato elegido y guarda
todo en `localStorage`.

Stack: **Vite + React 18 + TypeScript**, PapaParse (CSV) y SheetJS/xlsx (Excel).

## Campos del CV

Nombre completo · Título profesional · Años de experiencia · Habilidades ·
Correo · Salario esperado.

## Funcionalidades

1. **Ingesta**: subida de `.csv` (separador `,` o `;` autodetectado, UTF-8) o
   `.xlsx`.
2. **Column Mapper**: un `<select>` por campo con las columnas del archivo.
   Autosugerencia por similitud de nombre. El botón *Confirmar mapeo* queda
   deshabilitado hasta mapear los 6 campos.
3. **Carga dinámica**: selector de candidatos; al elegir uno, el formulario se
   rellena y queda editable.
4. **Persistencia**: datos importados, mapeo, candidato seleccionado y
   ediciones del formulario se guardan en `localStorage` y se restauran al
   recargar. Botón *Limpiar datos*.
5. **Validaciones**: correo con formato válido; años y salario numéricos `>= 0`.

## Manejo de errores

- Archivo vacío o sin filas de datos.
- Formato no soportado (distinto de `.csv` / `.xlsx`).
- JSON corrupto en `localStorage` (el hook `useLocalStorage` cae al valor
  inicial sin romper la app).

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

`dataset_candidatos_cv.csv` incluye 10 filas. **A propósito** sus columnas NO
coinciden con los nombres de los campos del CV (`Nombre_Completo`, `Puesto`,
`Anios_Exp`, `Skills`, `Mail`, `Sueldo_Pretendido`), para probar el mapeo y la
autosugerencia. Usa `;` como separador, que PapaParse detecta solo.

## Estructura del proyecto

```
cv-mapper/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── dataset_candidatos_cv.csv
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx              # Orquesta estado y flujo completo
    ├── index.css
    ├── types.ts             # Tipos y constantes (campos del CV)
    ├── hooks/
    │   └── useLocalStorage.ts
    ├── utils/
    │   ├── fileParser.ts    # PapaParse (CSV) + SheetJS (Excel)
    │   └── mapping.ts       # Autosugerencia de mapeo por similitud
    └── components/
        ├── FileUploader.tsx
        ├── ColumnMapper.tsx
        ├── CandidateSelector.tsx
        └── CVForm.tsx
```
