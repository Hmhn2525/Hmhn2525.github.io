# Evidencia y alcance

Fecha de revisión: 2026-10-05.

- Repositorio operativo existente privado confirmado mediante GitHub autenticado. Su visibilidad y código se conservan.
- README, arquitectura, guía del recorrido vigente, informes de interfaz/publicación, SimpleCounts y pruebas visuales revisados localmente.
- Fuente revisada: revisión d57fb9f3c73aa468cca2f975ba3f4befe505ff79. El informe de despliegue identifica 682f328be2ae3e45e23cb4acc2d2327b5ee09b12 como revisión desplegada; no son la misma revisión.
- Material visual publicado: referencia de inicio con identidad sintética; no se ofrece como verificación nueva del flujo ni como evidencia de operación productiva.
- Ejemplo didáctico nuevo: cinco casos de cantidades y estados, ejecutables sin red ni servicios externos.
- Suite previa de 16 casos citada desde el informe; no reejecutada. No se hicieron nuevas pruebas de la aplicación operativa.

No se publican Excel originales, saldos, cuentas reales, configuraciones privadas, respaldos, rutas de trabajo o imágenes operativas. No se consulta el piloto ni se escribe en sus servicios. No se afirma aceptación del área ni autorización definitiva de operación.

## Ejemplo de conteo y conciliación · actualizado 2026-10-09

`python examples/verify.py` recorre cinco líneas sintéticas. El resultado distingue una coincidencia, dos faltantes —uno con conteo confirmado en cero—, un sobrante y una línea pendiente. Cuatro líneas contadas suman una diferencia neta de `-2.5`; la línea pendiente no participa.

La salida comprueba el modelo de ejemplo con decimales exactos. No ejecuta la aplicación operativa, no autoriza ajustes ni escribe en el ERP.

## Captura de interfaz pendiente

No se añadió una captura nueva del conteo y resumen operativo porque no se pudo abrir la interfaz original en el navegador de revisión. images/mockup-synthetic.svg es una vista vectorial generada desde cinco líneas ficticias, no una captura de la UI original.
