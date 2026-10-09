# Caso de estudio: Data Warehouse Agrícola y Analítica de Rendimiento Operativo

## Necesidad

Consolidar datos de producción y costos por centro y periodo sin multiplicar importes al unir fuentes y sin confundir cero explícito con dato ausente.

## Decisión técnica del ejemplo

Cada fuente se agrega por centro y periodo antes del cruce. El modelo genera las 24 combinaciones de cuatro centros y seis periodos, incluso cuando falta una fuente. Claves primarias, referencias y una transacción detectan duplicados y referencias inválidas. Las huellas SHA-256 hacen idempotente la reimportación de un mismo archivo.

El [diccionario de datos](data-dictionary.md) fija el grano, las unidades, el costo ponderado, los faltantes y las reglas de anomalía. El comando `python examples/verify.py` carga los CSV, valida, consulta y exporta las filas que consume el [dashboard](../demo/index.html).

## Resultado verificable

La salida incluye 1,768 unidades registradas, MXN 12,025.00 de costos y MXN 6.79 por unidad ponderado sobre 1,713 unidades completas. Incluye un cero explícito, una combinación sin costo, una sin producción y un costo unitario alto ficticio. No afirma métricas de productividad o ahorro.

## Experiencia y evidencia

La aportación descrita en README corresponde al flujo de consolidación en Google Sheets, cruce de datos, definición de indicadores y consultas analíticas para Looker Studio. Una revisión local histórica, fechada el 5 de octubre de 2026, registró cuatro archivos GAS con 16 definiciones y compilación sin errores; también dejó pendiente resolver una declaración duplicada de `HOJA_LOG` frente al endpoint.

La demo web de este repositorio es nueva e independiente. No es captura ni interfaz del sistema original. Evidencia actual de la interfaz real, Looker Studio conectado, BigQuery, consultas, linaje y despliegue sigue pendiente. No se ejecutaron escrituras operativas.

## Aprendizajes

Definir primero el grano evita inflar sumas. Los importes enteros en centavos evitan errores binarios. Los faltantes deben seguir nulos hasta la presentación; transformarlos en cero cambia el significado del indicador.
