# Verificación del sitio publicado — 2026-10-06

Sitio revisado: [hmhn2525.github.io](https://hmhn2525.github.io/).
Commit desplegado y comprobado: `de281b8e9a4488e19bd42246e78887084f3e0435`.

## Recorrido comprobado

Se revisaron la portada y los seis casos de estudio con el navegador, a 320, 768 y 1440 píxeles: **21 vistas**. La evidencia se obtuvo el 6 de octubre de 2026 y finalizó a las 14:47 UTC-06:00 (America/Mexico_City).

| Comprobación | Resultado observado |
|---|---|
| Diseño responsive | Sin desbordamiento horizontal en las 21 vistas; `scrollWidth <= clientWidth`. |
| Imágenes | Las seis imágenes de los casos cargaron, con texto alternativo, en los tres tamaños. |
| Lectura y distribución | No se observaron recortes de texto ni superposiciones en las vistas revisadas. |
| Tabulación | Recorrido hacia adelante en los tres tamaños; retroceso con Shift+Tab en tableta y escritorio; foco visible en los controles recorridos y sin bloqueo observado. |
| Menú y salto al contenido | Activación mediante Enter y navegación a las secciones previstas. |
| Cambio de tema | Activación por teclado: Space en móvil y Enter en tableta/escritorio. |
| Casos de estudio | Apertura por teclado de los seis desplegables y navegación de ida y vuelta a cada caso. Cierre mediante Space comprobado en tableta y escritorio. |
| Formulario vacío | Señala los tres campos y sitúa el foco en el nombre. |
| Correo inválido | Muestra el error correspondiente y sitúa el foco en el correo. |
| Mensaje válido ficticio | Prepara un enlace `mailto:` con destinatario, asunto, acentos, símbolo `&` y salto de línea conservados. Muestra el enlace de reintento. |
| Envío | No se realizó ninguna acción de envío; se comprobó únicamente la preparación del mensaje. |
| Consola del navegador | Sin errores observados en la sesión de revisión. |

Se emplearon exclusivamente valores ficticios en el formulario. Las capturas y los registros detallados se conservan como evidencia local de la revisión; no se distribuyen fuentes operativas ni respaldos privados.

## Alcance y límites

Esta revisión acredita el recorrido web observado en el commit indicado. No certifica conformidad completa con un estándar de accesibilidad ni todas las combinaciones de navegador, lector de pantalla o dispositivo físico. La preparación del mensaje no prueba su entrega por un proveedor de correo.

Las pruebas de los proyectos presentados, sus ejemplos sintéticos y la aceptación de las áreas operativas mantienen los límites de sus respectivos repositorios. La reparación de endpoints GAS, la inspección de BigQuery, las licencias y las dependencias transitivas continúan como trabajos técnicos independientes.

[Volver a la documentación del sitio](../README.md).
