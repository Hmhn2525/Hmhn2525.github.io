# Verificación y límites

Fecha: 2026-10-09.

## Flujo público reproducible

Comando ejecutado con Python 3 y SQLite de biblioteca estándar:

```text
python examples/verify.py
```

Resultado: 4 centros × 6 periodos, 24 combinaciones exportadas; 24 registros de producción y 24 de costos cargados. El verificador comprobó encabezados, identificadores `DEMO-`, referencias, sumas, costo unitario, cero explícito, datos faltantes, reimportación idempotente, rechazo de clave primaria repetida, `PRAGMA foreign_key_check`, `PRAGMA quick_check` y correspondencia entre consulta y CSV.

Valores base comprobados:

| Indicador / caso | Resultado |
|---|---:|
| Unidades registradas | 1,768 |
| Costos registrados | MXN 12,025.00 |
| Pares completos con producción positiva | 1,713 unidades; MXN 11,625.00 |
| Costo unitario ponderado de pares completos | MXN 6.79 |
| Clave agregada DEMO-CC-001 / 2026-01 | 100 unidades; MXN 500.00; MXN 5.00/unidad |
| DEMO-CC-002 / 2026-03 | 0 unidades; costo presente; costo unitario nulo |
| DEMO-CC-003 / 2026-02 | costo faltante |
| DEMO-CC-003 / 2026-04 | producción faltante |

El script genera `examples/outputs/aggregated-results.csv` y `dashboard-data.js`. La página carga el segundo archivo; no solicita servicios externos y su tabla muestra los mismos datos agregados.

## Evidencia externa pendiente

- Captura accesible y actual de la interfaz real con datos ficticios.
- Acceso vigente a Sheets y Looker Studio, filtros, actualización y recorrido de datos.
- Evidencia de ejecución, conexión, SQL, linaje y resultados de BigQuery.
- Confirmación de versión desplegada, declaración duplicada de `HOJA_LOG` y pruebas sobre copia ficticia.
- Aceptación humana y métricas de operación.

El [mockup SVG](images/mockup-synthetic.svg) se compuso con categorías generales y los valores del fixture público; no es una captura. La revisión visual del dashboard sigue pendiente porque no se pudo abrir en el navegador de revisión. No se afirma una validación visual a 320, 768 ni 1440 px.

La apertura histórica de una hoja y un informe, anotada el 5 de octubre de 2026, no demuestra el estado actual. No se ejecutaron consolidaciones ni escrituras remotas en esta actualización. Un ejemplo público correcto no certifica el sistema operativo ni su aceptación.
