# Archivos de prueba

Cada archivo cubre un caso de la app. Subilos con el paso 1. Los campos se
generan a partir de las columnas de cada archivo, así que el paso 2 cambia
según el que subas.

| Archivo | Qué prueba | Resultado esperado |
|---|---|---|
| `01_candidatos_coma.csv` | CSV con separador `,`, encabezados en inglés, acentos y `ñ`, celdas entre comillas con comas | 6 campos (Full Name, Position, Years, Tech Skills, Email, Salary), 5 filas. Email se infiere como correo; Years y Salary como número |
| `02_candidatos.xlsx` | Excel con encabezados distintos (`Apellido y Nombre`, `Antigüedad (años)`, `E-mail`, `Pretensión Salarial`) | Campos con esos nombres, 6 filas. Antigüedad y Pretensión como número; E-mail como correo |
| `03_candidatos_errores.csv` | Validaciones genéricas | Correo inválido (Juan, Raúl), Experiencia negativa o no numérica (Laura, Raúl), Salario texto o negativo (Pablo, Elena, Raúl), campos vacíos sin error (Marta). Sergio no tiene errores. Las celdas con error se marcan en rojo en la tabla |
| `04_columnas_raras.csv` | Encabezados sin significado (`Col_A`…`Col_F`, `Observaciones`) | 7 campos; los tipos salen solo de los valores: Col_C y Col_F número, Col_E correo, el resto texto |
| `05_solo_encabezados.csv` | CSV con encabezados y sin filas | Error: "El archivo no contiene filas de datos (solo encabezados o nada)." |
| `06_vacio.csv` | Archivo de 0 bytes | Error: "El archivo está vacío." |
| `07_formato_no_soportado.txt` | Extensión no permitida | Error: "Formato no soportado. Subí un archivo .csv o .xlsx." |
| `08_dos_hojas.xlsx` | Excel con 2 hojas de tablas distintas ("Empleados" y "Productos") y una hoja vacía | Aparece el selector de hoja con 2 opciones (la vacía se ignora). Al cambiar de hoja se regeneran los campos. Errores: Sofía (correo), Diego (edad negativa), Mouse (precio negativo). `fecha_ingreso` se muestra como AAAA-MM-DD |

## Prueba de persistencia

1. Cargá `01_candidatos_coma.csv`, confirmá los campos, elegí una fila y editá un valor.
2. Recargá la página (F5): deben restaurarse el archivo, los campos, la fila elegida y la edición (marcada en la tabla).
3. Tocá **Limpiar datos**: todo vuelve al estado inicial.

## Prueba de JSON corrupto en localStorage

En la consola del navegador (F12):

```js
localStorage.setItem("tablaapp.v2.campos", "{roto");
location.reload();
```

La app debe cargar igual: los campos se vuelven a inferir del archivo y se
muestra una advertencia en la consola.
