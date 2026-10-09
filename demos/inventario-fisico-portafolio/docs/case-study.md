# Caso de estudio: Inventario Físico

## Necesidad

Convertir un reporte de existencias en una lista compartida de conteo y un resumen trazable para conciliación. Un dato vacío significa pendiente; cero significa una observación confirmada.

## Aportación documentada

El caso presenta el diseño y la evolución de una plataforma asociada al portafolio: importación revisable, conteo directo, historial, autorización por almacén y organización adaptable de la interfaz. La revisión acredita esos elementos en fuentes y documentos; no acredita autoría exclusiva de todas las dependencias o componentes.

## Decisiones

El recorrido vigente simplifica la operación a subir, contar y consultar resultados. No exige entrega, validación o reconteo obligatorios de las rutas históricas. Las cantidades utilizan decimales exactos. La versión esperada evita sobrescrituras; los reintentos llevan identidad propia. El resultado se concilia fuera de la aplicación.

## Evidencia

El informe de interfaz del 5 de octubre registra 16 casos únicos Playwright sintéticos aprobados a 360/768/1366 píxeles. La imagen pública ya existente queda como referencia visual con identidad sintética, no como evidencia nueva de este cambio. El informe de despliegue documenta la publicación posterior de las correcciones y una comprobación de respaldo/restauración aislada. Son antecedentes documentados, no pruebas remotas repetidas en esta etapa.

El ejemplo reproducible muestra cada línea, sus estados y una diferencia neta de `-2.5` entre cuatro líneas contadas. Cero confirmado produce faltante; la línea `null` permanece pendiente y queda fuera del total. No replica todo el sistema ni envía ajustes al ERP.

## Aprendizajes y límites

Conservar el significado de cero y vacío evita resultados engañosos. El estado de guardado debe ser visible y los conflictos requieren consulta antes de corregir. Una prueba visual con respuestas simuladas no verifica permisos reales ni recuperación remota. No se atribuyen métricas de ahorro, adopción ni capacidad productiva.

## Próxima fase

Validar recuperación remota, concurrencia con identidades independientes, dispositivos físicos y aceptación del área en entornos aislados. Las responsabilidades personales en la lógica de conciliación, interfaz React y API ASP.NET Core han sido confirmadas en el README; la definición de licencia queda pendiente en su fase propia.
