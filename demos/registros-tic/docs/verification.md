# Verificación y límites del ejemplo público

Fecha: 2026-10-09.

## Reproducir

Desde la raíz del repositorio, ejecuta:

    python examples/verify.py

El verificador lee solo examples/scenario.json. Comprueba cinco IDs DEMO-TIC-, secuencia de estados, historial no vacío, conteo por estado final, conteo por categoría y total abierto esperado.

## Demo interactiva

Abre demo/index.html. Permite crear un ticket ficticio, agregar etapas de seguimiento y recalcular el resumen en memoria del navegador. Reiniciar restaura la fixture inicial. No llama a React, Supabase, PostgreSQL, Looker Studio ni a servicios externos.

La pantalla y el [mockup](images/mockup-synthetic.svg) son un modelo didáctico independiente. La aplicación actual permite crear tickets y consultar recientes; no ofrece edición de estados ni tablero de reportes.

## Alcance

- Los valores y usuarios de la fixture son ficticios.
- La demo no guarda cambios al recargar y no valida autenticación, autorización o sincronización remota.
- El ejemplo no mide tiempos, ahorro, adopción ni resultados operativos.
- La revisión de dependencias y la evidencia histórica de la aplicación se mantienen separadas de esta fixture sintética.
