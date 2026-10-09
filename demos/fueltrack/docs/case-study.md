# Caso de estudio: FuelTrack

## Necesidad

Coordinar solicitudes, autorización de cuotas y captura en campo, conservando evidencia y evitando descontar dos veces una operación reintentada.

## Aportación documentada

Este caso organiza la revisión de fuentes, pruebas sintéticas, arquitectura y límites de una solución asociada al portafolio. Se preservan las reservas sobre autoría exclusiva de todos los componentes y componentes de terceros. Las responsabilidades personales en validación de cuotas, concurrencia (`LockService`), lógica de idempotencia por clave y persistencia offline han sido confirmadas en el README.

## Decisiones observadas

Conservar GAS y Sheets permite estudiar mejoras dentro de la arquitectura existente. Los reintentos deben comprobar identidad y contenido antes de consumir cuota. El almacenamiento local conserva el pendiente hasta obtener una confirmación verificable.

## Evidencia

Evidencia histórica fechada (5 de octubre de 2026): se ejecutaron nuevamente 65 pruebas locales simuladas: 65 correctas, cero fallos. Cubren autorización, saldos, fallos de almacenamiento, reintentos, consultas y conservación offline. La simulación no mide latencia de Google y se diferencia de la comprobación del ejemplo público sintético.

El ejemplo reproducible ejecuta dos intentos con la misma clave y comprueba un solo descuento de 20 L y un saldo de 80 L en memoria. El [recorrido ilustrativo](../demo/index.html) usa datos inventados y no demuestra ejecución de la aplicación original. La imagen conserva esa identificación explícita.

Este resultado acredita únicamente el modelo didáctico del repositorio. No ejecuta GAS/Sheets ni acredita comportamiento operativo.

## Aprendizajes

La captura offline exige conservar autor, clave y evidencia. Una consulta de saldo o un caché no reemplaza el histórico ni demuestra sincronización remota.

## Próxima fase

- Integración en una copia de Sheets y una carpeta Drive de pruebas.
- Comparación del código desplegado, permisos y activadores reales.
- Pruebas de dispositivos, red interrumpida y actualización de una PWA instalada.
- Aceptación humana de fotografías y firmas; decisión de licencia en su fase técnica propia.
