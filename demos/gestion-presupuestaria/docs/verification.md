# Verificación y límites

Fecha de esta nota: 2026-10-09.

## Fixture pública

Desde la raíz del repositorio, con Python 3 y Node.js 20:

```text
python examples/verify.py
node examples/verify_state.js
node examples/render_mockup.js --check
```

El verificador local comprueba que la fixture JSON sea idéntica a la incrustada en la página autónoma y que los datos rotulados del SVG coincidan con ella. Revisa dos centros, tres partidas y doce meses por partida; unicidad de identificadores; asignaciones ficticias válidas; montos de hasta dos decimales; total esperado de cada centro; ceros capturados y un pendiente por centro.

El verificador Node ejecuta el mismo módulo de estado que usa la interfaz. Comprueba totales en centavos, cero frente a pendiente, bloqueo de entregas incompletas, rechazo obsoleto sin mutaciones, devolución con observación, nueva entrega, validación y preservación del primer snapshot tras editar.

`node examples/render_mockup.js --check` compara el SVG con su generador basado en `examples/scenario.json`. El asset es un mockup sintético fechado 2026-10-09, con origen y alcance visibles; no es captura del piloto ni evidencia del backend.

Totales iniciales previstos:

| Centro | Capturados | Pendientes | Ceros explícitos | Total parcial |
|---|---:|---:|---:|---:|
| DEMO-CC-001 | 35 | 1 | 11 | $3,600.00 MXN |
| DEMO-CC-002 | 35 | 1 | 11 | $2,400.00 MXN |

El subtotal suma importes capturados e ignora pendientes; la etiqueta informa cuántos faltan. Capturar `0.00` incrementa el conteo de celdas capturadas, no el subtotal monetario.

## Recorrido en navegador

La página abre directamente desde disco. El recorrido funcional es:

1. Elige perfil y centro ficticios. Los perfiles de captura solo pueden editar su centro asignado dentro de esta interfaz.
2. Corrige o completa importes. Entrega queda deshabilitada con pendientes; “Registrar vacíos como 0.00” es una acción explícita y editable.
3. Entrega para crear un snapshot y bloquear la matriz durante la revisión.
4. Cambia al perfil de revisión. Devuelve con observación o valida la entrega.
5. Tras una devolución, edita y envía otra vez. La primera entrega permanece en el historial.
6. En borrador o devolución, prueba el rechazo con versión anterior. El evento queda registrado, pero los importes y snapshots no cambian.
7. Reinicia el escenario para volver a la fixture inicial.

**Inspección de código, no prueba visual:** botones, select, campos numéricos y textarea son controles nativos; hay estilos de foco visibles. La matriz usa desplazamiento horizontal propio y la hoja define cortes de diseño en 680 y 1040 px. El recorrido de teclado y la validación visual a 320, 768 y 1440 px quedan pendientes porque la demo no se pudo abrir en el navegador de revisión.

## Fuente original

El 5 de octubre de 2026 se ejecutaron 19 pruebas sintéticas seleccionadas del servidor local privado: 19 correctas, con una advertencia de deprecación en una dependencia de pruebas. Cubrieron presupuesto nativo, programa, capacidades y alta de participantes. La ejecución es histórica, no reproducible desde este repositorio; no sustituye una suite completa ni aceptación funcional.

Las fuentes privadas permanecen fuera del repositorio. No se incluyen rutas internas, datos reales ni credenciales.

## Condiciones no acreditadas

- Autorización efectiva, autenticación o aislamiento por usuario: los perfiles públicos son controles de interfaz modificables por quien ejecuta la página.
- Persistencia, auditoría durable, recuperación o concurrencia entre sesiones: el estado vive solo en memoria.
- Aceptación funcional, operación productiva, accesibilidad certificada o pruebas con dispositivos físicos.
- Inspección visual de la demo a 320, 768 y 1440 px y recorrido interactivo de teclado.
- Verificación actual de la versión operativa, catálogos o reglas aplicables.
