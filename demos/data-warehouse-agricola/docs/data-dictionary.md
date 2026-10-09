# Diccionario de datos sintéticos

Fecha de revisión: 2026-10-09. Todas las claves, cantidades y etiquetas de este ejemplo son inventadas.

## Archivos de entrada

| Archivo / campo | Tipo y unidad | Regla |
|---|---|---|
| `centers.csv: center_id` | Texto | Clave primaria de centro; inicia con `DEMO-`. |
| `centers.csv: center_name` | Texto | Etiqueta ficticia para presentación. |
| `periods.csv: period_id` | Texto `AAAA-MM` | Clave primaria de periodo; seis periodos en el escenario base. |
| `periods.csv: period_label` | Texto | Etiqueta legible del periodo. |
| `production.csv: record_id` | Texto | Clave única de registro; inicia con `DEMO-`. |
| `production.csv: center_id`, `period_id` | Texto | Referencias obligatorias a las dimensiones. |
| `production.csv: units` | Entero, unidades | No negativo. `0` significa producción registrada igual a cero. La ausencia de fila produce `NULL`, no cero. |
| `costs.csv: record_id` | Texto | Clave única dentro de costos; inicia con `DEMO-`. |
| `costs.csv: center_id`, `period_id` | Texto | Referencias obligatorias a las dimensiones. |
| `costs.csv: cost_cents` | Entero, centavos MXN | No negativo. Se conserva en centavos para sumar sin error de coma flotante. |

Los encabezados deben coincidir exactamente. Celdas vacías, columnas adicionales, números inválidos, claves repetidas dentro del archivo y referencias desconocidas cancelan la carga. La clave primaria de SQLite rechaza claves ya cargadas. El verificador carga cada fuente en una transacción y guarda su SHA-256: volver a importar el mismo archivo no duplica registros; modificar el archivo no habilita claves ya usadas.

## Grano y faltantes

El grano de salida es una fila por `center_id` y `period_id`. El producto cartesiano de centros y periodos crea las 24 combinaciones; las fuentes se agregan por separado antes del `LEFT JOIN`.

| Estado | Producción (`production_units`) | Costo (`cost_cents`) | Costo unitario |
|---|---:|---:|---:|
| Registro normal | Suma de registros | Suma de centavos | Costo MXN agregado / unidades, si unidades > 0 |
| Cero explícito | `0` | Puede existir o faltar | No aplica; no se divide entre cero |
| Sin registros de producción | `NULL` | Puede existir | No disponible |
| Sin registros de costos | Puede existir | `NULL` | No disponible |

La salida CSV deja vacía una celda `NULL`. El dashboard muestra “Pendiente”. Un cero permanece visible como `0`.

## Indicadores y alertas

- **Producción registrada:** suma de unidades no nulas en la selección. Los ceros explícitos contribuyen cero y cuentan como registro.
- **Costos registrados:** suma de todos los costos conocidos en la selección, aunque no haya producción.
- **Costo unitario por fila:** `SUM(cost_cents) / 100 / SUM(units)`, después de agregar cada fuente. Solo existe si costo está registrado y unidades > 0. La salida se redondea a dos decimales MXN.
- **Costo unitario ponderado:** costo total de pares completos con unidades > 0 dividido entre las unidades de esos mismos pares. Evita tratar el promedio simple de centros como si tuviera igual volumen.
- **Tendencia:** agrega por periodo las unidades y costos conocidos. Su costo unitario usa la misma regla ponderada y excluye pares incompletos o con producción cero.
- **Anomalías:** `missing_production`, `missing_cost`, `zero_production` y `high_unit_cost`. Esta última marca costo unitario exacto igual o mayor a dos veces el promedio ponderado del escenario completo. El umbral mostrado se redondea a dos decimales; la clasificación usa el valor sin redondear. Son reglas didácticas, no controles operativos.

## Salidas generadas

`examples/outputs/aggregated-results.csv` contiene centro, periodo, unidades, costo MXN, costo unitario MXN y señales. Una celda numérica vacía representa un faltante. `dashboard-data.js` contiene las mismas filas consultadas y las dimensiones que usan los filtros del dashboard.
