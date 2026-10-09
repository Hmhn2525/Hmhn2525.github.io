# Verificación y límites

Fecha: 2026-10-05.

## Fuente local

El 5 de octubre de 2026 se ejecutaron nuevamente 65 pruebas locales simuladas: 65 correctas, cero fallos. Cubren autorización, saldos, fallos de almacenamiento, reintentos, consultas y conservación offline. La simulación no mide latencia de Google.

Las fuentes privadas se conservaron. Las ubicaciones y huellas revisadas se registran en la ficha de gestión local; no se copian documentos internos ni rutas operativas al repositorio público. Las pruebas originales no se distribuyen, por lo que este repositorio no permite reproducir su suite.

## Material público reproducible · actualizado 2026-10-09

`python examples/verify.py` procesa dos intentos sintéticos con la misma clave y el mismo importe. El primero registra 20 L; el segundo reutiliza el recibo y no vuelve a descontar. El resultado del modelo es una operación única, 20 L debitados y 80 L de saldo.

La simulación corre solo en memoria. No invoca GAS, Sheets, Drive ni red; por eso no prueba la idempotencia desplegada, persistencia, concurrencia ni recuperación ante desconexiones. El recorrido HTML es autónomo, no solicita datos externos y permite avanzar por las etapas explicativas mediante teclado.

## Captura de interfaz pendiente

No se añadió una captura nueva del flujo operativo porque no se pudo abrir la interfaz original en el navegador de revisión. El SVG images/mockup-synthetic.svg es un mockup vectorial generado desde el fixture, no una captura de la UI original.

## Condiciones no acreditadas

- Integración en una copia de Sheets y una carpeta Drive de pruebas.
- Comparación del código desplegado, permisos y activadores reales.
- Pruebas de dispositivos, red interrumpida y actualización de una PWA instalada.
- Aceptación humana de fotografías y firmas; decisión de licencia en su fase técnica propia.

Un repositorio publicado y un ejemplo correcto no certifican operación productiva ni aceptación de usuarios.
