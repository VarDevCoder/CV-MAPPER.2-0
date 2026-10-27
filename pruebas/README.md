# Archivos de prueba

Cada archivo cubre un caso de la app. Subilos con el botón de la sección 1.

| Archivo | Qué prueba | Resultado esperado |
|---|---|---|
| `01_candidatos_coma.csv` | CSV con separador `,`, encabezados en inglés, acentos y `ñ`, celdas entre comillas con comas | Se cargan 5 candidatos; el mapeo se autosugiere completo (Full Name, Position, Years, Tech Skills, Email, Salary) |
| `02_candidatos.xlsx` | Excel con encabezados distintos (`Apellido y Nombre`, `Antigüedad (años)`, `E-mail`, `Pretensión Salarial`) | Se cargan 6 candidatos; mapeo autosugerido completo |
| `03_candidatos_errores.csv` | Validaciones del formulario | Correo inválido (Juan, Raúl), años negativos o no numéricos (Laura, Raúl), salario texto o negativo (Pablo, Elena, Raúl), campos vacíos (Marta). Sergio no tiene errores |
| `04_columnas_raras.csv` | Encabezados sin relación (`Col_A`…`Col_F`) y una columna extra | No se autosugiere nada; *Confirmar mapeo* queda deshabilitado hasta mapear los 6 campos a mano |
| `05_solo_encabezados.csv` | CSV con encabezados y sin filas | Error: "El archivo CSV no contiene filas de datos." |
| `06_vacio.csv` | Archivo de 0 bytes | Error: "El archivo está vacío." |
| `07_formato_no_soportado.txt` | Extensión no permitida | Error: "Formato no soportado. Subí un archivo .csv o .xlsx." |

## Prueba de persistencia

1. Cargá `01_candidatos_coma.csv`, confirmá el mapeo, elegí un candidato y editá un campo.
2. Recargá la página (F5): deben restaurarse el archivo, el mapeo, el candidato y la edición.
3. Tocá **Limpiar datos**: todo vuelve al estado inicial.

## Prueba de JSON corrupto en localStorage

En la consola del navegador (F12):

```js
localStorage.setItem("cvmapper.mapeo", "{esto no es json");
location.reload();
```

La app debe cargar igual (con el mapeo vacío) y mostrar una advertencia en consola.
