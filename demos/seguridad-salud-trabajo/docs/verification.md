# Verificación y límites

Fecha: 2026-10-05.

## Fuente local

El 5 de octubre de 2026 se consultó en lectura el código del proyecto GAS SST: 27 funciones identificadas. Se comprobaron cuatro casos de utilidades en un entorno local sin servicios Google. No se ejecutaron formularios, activadores ni escrituras remotas.

Las fuentes privadas se conservaron. Las ubicaciones y huellas revisadas se registran en la ficha de gestión local; no se copian documentos internos ni rutas operativas al repositorio público. Las pruebas originales no se distribuyen, por lo que este repositorio no permite reproducir su suite.

## Material público reproducible · actualizado 2026-10-09

`python examples/verify.py` revisa seis casos con registros ficticios: catálogo activo, referencia ausente, catálogo inactivo, fecha límite anterior a la recepción, límite fuera de plazo y fecha imposible (`2026-02-30`). Para este ejemplo, el plazo didáctico permite hasta cinco días naturales; no representa una política operativa. La fecha válida también muestra su semana ISO.

El verificador no llama al código GAS ni a Google Forms o Sheets. El recorrido HTML es autónomo, no solicita datos externos y permite avanzar por las etapas explicativas mediante teclado.

## Captura de interfaz pendiente

No se añadió una captura nueva de la validación SST operativa porque no se pudo abrir la interfaz original en el navegador de revisión. images/mockup-synthetic.svg es un mockup vectorial generado desde seis registros inventados, no una captura de la UI original.

## Condiciones no acreditadas

- Verificar formularios y activadores en una copia aislada con registros ficticios.
- Revisar acceso, retención y distribución por la sensibilidad de los registros.
- Corregir o validar fechas imposibles: la normalización simple puede desplazar días a otro mes.
- Evaluar eventos omitidos cuando el bloqueo está ocupado; reporting y aceptación humana pendientes.
- Definición de licencia en su fase técnica propia.

Un repositorio publicado y un ejemplo correcto no certifican operación productiva ni aceptación de usuarios.

## Enlaces facilitados posteriormente

La hoja SST y el informe Looker Studio facilitados por el solicitante abrieron el 5 de octubre de 2026. El endpoint GAS devolvió `Script function not found: doGet`. Este resultado afecta su acceso HTTP; no demuestra fallo de todos los activadores de Sheets. No se inspeccionaron registros personales ni consultas SQL del informe.

El solicitante reporta una conexión BigQuery para las consultas de Looker Studio. Su configuración, permisos y SQL permanecen pendientes de verificación. Los enlaces e identificadores operativos se conservan exclusivamente en gestión privada.
