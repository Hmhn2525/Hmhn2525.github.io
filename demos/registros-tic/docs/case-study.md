# Caso de estudio: Registros TIC

**Autor del portafolio:** Héctor Manuel Hernández Narváez.

**Área:** digitalización del soporte, trazabilidad y organización de datos.

**Estado:** demostración saneada con recorrido local verificado el 5 de octubre de 2026.

## Necesidad

Una atención de soporte genera información que debe mantenerse relacionada: solicitante, activo, categoría, descripción, técnico y conformidad. La propuesta reúne esos elementos en una aplicación accesible desde el navegador, con captura orientada a campo y consulta de evidencias.

## Aportación y alcance verificable

El trabajo presentado comprende la aplicación de registro, su modelo relacional, la preparación de datos sintéticos y la documentación técnica de la demostración. El código y la evidencia local permiten revisar formulario, catálogos, persistencia e historial. No se atribuyen despliegues, uso institucional, impacto cuantificado ni autoría exclusiva de cada componente a partir de estos archivos.

## Decisiones

- React y TypeScript organizan la interfaz y los tipos del dominio; Vite y Tailwind permiten construir y presentar la aplicación.
- PostgreSQL representa las relaciones entre usuarios, activos y atenciones; Supabase aporta interfaces de acceso y almacenamiento en el diseño existente.
- El modo demo permite explorar el flujo sin credenciales ni una base empresarial.
- La copia pública parte de datos sintéticos y de un historial Git nuevo; el material de recuperación permanece fuera del contenido publicable.
- La documentación distingue el almacenamiento local de la sincronización remota y la captura de conformidad de una autenticación segura.

## Evidencia disponible

El recorrido local seleccionado en la evidencia del 5 de octubre usó catálogos demo, guardó una atención ficticia mediante la modalidad PIN, consultó el historial y recargó la aplicación. No hubo conexión a Supabase ni firma personal. El [README](../README.md) conserva referencias visuales del repositorio, sin presentarlas como evidencia nueva de este cambio.

El ejemplo `examples/verify.py` muestra cinco tickets ficticios, su historial de estados y un agregado por estado final y categoría. Es un modelo independiente, no la salida de la interfaz. La aplicación permite crear y consultar tickets, pero no incluye edición de estados ni tablero de reportes.

La instalación reproducible, lint y compilación pasaron. La auditoría npm detectó dos dependencias transitivas con severidad alta: `brace-expansion` y `fast-uri`, dentro de la cadena de herramientas PWA. La corrección queda para una fase técnica con revisión de compatibilidad.

La función de firma remota y el esquema se revisaron por inspección. No se ejecutó una prueba completa de servidor, autorización, Storage ni instalación móvil.

La [demo de creación, seguimiento e informe](../demo/index.html) amplía ese modelo en memoria y permite agregar estados sin salir del escenario ficticio. El [mockup sintético](images/mockup-synthetic.svg) visualiza la fixture; no es una captura de la UI original. El [verificador](verification.md) sigue siendo la comprobación reproducible.

## Resultado y aprendizajes

El resultado es un caso demostrable de organización de datos y digitalización del soporte, con material visual sintético e instrucciones reproducibles. No existen mediciones verificadas de tiempo, ahorro o adopción.

La revisión evidencia que tener una cola local no garantiza sincronización automática, que ocultar un PIN no valida identidad y que una compilación correcta no acredita permisos adecuados. La separación entre demostración y operación real ayuda a presentar el proyecto con precisión.

## Próxima fase técnica

Corregir dependencias, introducir autenticación y políticas restrictivas, proteger firmas, validar enlaces y PIN en servidor, implementar sincronización con recuperación segura y completar/verificar recursos PWA. Estas mejoras requieren sus propias especificaciones y pruebas.
