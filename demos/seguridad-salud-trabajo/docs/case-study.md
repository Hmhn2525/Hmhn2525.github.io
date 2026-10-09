# Caso de estudio: Digitalización, Gobernanza y Analítica de Seguridad y Salud en el Trabajo

## Necesidad

Organizar la captura y actualización de registros de SST relacionados con catálogos, fechas e inventario, conservando la privacidad de la información.

## Aportación documentada

Este caso organiza la revisión de fuentes, pruebas sintéticas, arquitectura y límites de una solución asociada al portafolio. Se preservan las reservas sobre autoría exclusiva de todos sus componentes y componentes de terceros. Las responsabilidades personales en análisis de requerimientos, flujos GAS, formularios estructurados, cálculo de semanas ISO y catálogos controlados con `DocumentLock` han sido confirmadas en el README.

## Decisiones observadas

Separar captura, catálogos y actualizaciones permite describir el flujo por responsabilidad. El bloqueo evita ejecución simultánea del enrutador, pero una salida por bloqueo ocupado requiere revisar cómo recuperar el evento.

## Evidencia

El 5 de octubre de 2026 se consultó en lectura el código del proyecto GAS SST: 27 funciones identificadas. Se comprobaron cuatro casos de utilidades en un entorno local sin servicios Google. No se ejecutaron formularios, activadores ni escrituras remotas.

El ejemplo público actualizado agrega seis casos ficticios de validación de catálogo y fechas límite. Usa una regla expresamente didáctica de cinco días naturales; no reproduce una política SST real ni ejecuta GAS.

El [recorrido ilustrativo](../demo/index.html) usa datos inventados y no demuestra ejecución de la aplicación original. La imagen conserva esa identificación explícita.

## Aprendizajes

La normalización de fechas no equivale a validación estricta del calendario. La privacidad debe revisarse también en formularios, enlaces, catálogos, exportaciones y herramientas de consulta.

## Próxima fase

- Verificar formularios y activadores en una copia aislada con registros ficticios.
- Revisar acceso, retención y distribución por la sensibilidad de los registros.
- Corregir o validar fechas imposibles: la normalización simple puede desplazar días a otro mes.
- Evaluar eventos omitidos cuando el bloqueo está ocupado; reporting y aceptación humana pendientes.
- Definición de licencia en su fase técnica propia.
