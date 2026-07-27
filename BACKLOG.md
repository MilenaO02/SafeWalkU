# Backlog priorizado de SafeWalk U

## Convenciones

- **P0:** bloqueante para una versión funcional y segura.
- **P1:** necesario para completar la primera versión.
- **P2:** mejora importante que puede entregarse después de los flujos críticos.
- **P3:** evolución futura fuera del alcance inmediato.
- **Hecho:** existe evidencia suficiente en el repositorio.
- **En revisión:** existe implementación, pero falta validar integración o criterios.
- **Pendiente:** no se encontró una implementación completa.

El estado representa el resultado de la auditoría inicial; no sustituye las pruebas de las fases siguientes.

## P0: flujos bloqueantes

| ID | Historia o tarea | Estado inicial | Criterios de aceptación |
|---|---|---|---|
| BL-01 | Como estudiante quiero registrarme para acceder a SafeWalk U. | En revisión | Correo único y del dominio permitido; contraseña con hash; rol no manipulable; respuestas 201 y 422 comprobadas. |
| BL-02 | Como usuario quiero iniciar sesión de forma segura. | En revisión | Credenciales válidas entregan JWT; credenciales incorrectas no revelan información; usuario inactivo no ingresa. |
| BL-03 | Como sistema quiero aplicar autenticación y permisos en backend. | En revisión | Todas las rutas privadas rechazan token ausente/inválido; las administrativas rechazan al estudiante con 403. |
| BL-04 | Como usuario quiero crear un reporte de incidente. | Completada | Datos validados; autor tomado del JWT; ubicación existente; reporte pendiente creado una sola vez; frontend confirma el resultado real. |
| BL-05 | Como administrador quiero revisar el estado de un reporte. | En revisión | Solo administrador; estados permitidos; revisor y cambio persistidos; error 404 controlado. |
| BL-06 | Como usuario quiero activar y cancelar una alerta SOS. | En revisión | Requiere confirmación y ubicación; crea `SOS_PANICO`; solo el propietario o rol autorizado puede cancelarla; conserva historial. |
| BL-07 | Como usuario quiero consultar rutas y zonas de riesgo en el mapa. | En revisión | API entrega coordenadas válidas; mapa maneja carga/error/vacío; no muestra datos desactivados. |
| BL-08 | Como equipo quiero levantar una base de datos reproducible. | En revisión | `schema.sql` y `seed.sql` ejecutan en MySQL limpio sin errores; claves y datos de prueba son coherentes. |
| BL-09 | Como equipo quiero una compilación confiable de frontend y backend. | En revisión | Build y comprobaciones estáticas pasan desde instalaciones limpias; los artefactos arrancan con la configuración declarada. |
| BL-10 | Como equipo quiero un contrato API coherente. | Completada | OpenAPI incluye todas las rutas reales, prefijos, esquemas, seguridad y códigos de respuesta; Swagger carga sin errores. |

## P1: primera versión completa

| ID | Historia o tarea | Estado inicial | Criterios de aceptación |
|---|---|---|---|
| BL-11 | Como usuario quiero consultar y editar mi perfil. | En revisión | Solo modifica la cuenta propia; valida campos; refleja cambios al volver a iniciar sesión. |
| BL-12 | Como usuario quiero actualizar mi foto. | En revisión | Valida propiedad, MIME y tamaño; nombre seguro; reemplazo controlado; URL accesible. |
| BL-13 | Como administrador quiero gestionar usuarios. | En revisión | Lista, consulta, edita y desactiva; no expone contraseñas; protege al menos las operaciones críticas. |
| BL-14 | Como usuario quiero adjuntar evidencia a un reporte. | En revisión | Solo archivos admitidos; relación válida; autorización definida; archivo y metadatos permanecen sincronizados. |
| BL-15 | Como usuario quiero gestionar mis contactos de emergencia. | En revisión | Lista solo contactos propios; crea datos válidos; impide eliminar contactos ajenos. |
| BL-16 | Como usuario quiero consultar lugares y servicios de apoyo. | En revisión | Devuelve datos activos con ubicación y teléfono cuando corresponda; interfaz ofrece estados claros. |
| BL-17 | Como administrador quiero gestionar rutas seguras. | En revisión | CRUD protegido; puntos ordenados; nivel y tiempo válidos; referencias inexistentes se rechazan. |
| BL-18 | Como administrador quiero consultar métricas. | En revisión | Endpoint protegido; cálculos contrastados con datos de prueba; panel maneja valores vacíos. |
| BL-19 | Como sistema quiero respuestas y errores consistentes. | En revisión | Formato común para éxito/error; 400/401/403/404/422/500 diferenciados; sin trazas sensibles. |
| BL-20 | Como usuario quiero una interfaz accesible y responsiva. | Completada | Flujos críticos con etiquetas y foco visibles; matriz Chrome aprobada entre 320 y 1440 px; acciones principales de al menos 44 × 44 px. |
| BL-21 | Como equipo quiero ejecutar pruebas repetibles. | En revisión | Pruebas automatizadas cubren autenticación, permisos, validación y flujos críticos; falta incorporarlas a CI. |
| BL-22 | Como operador quiero desplegar y comprobar el servicio. | En revisión | Docker Compose inicia los tres servicios; health check verifica API/BD; variables y volúmenes documentados. |

## P2: mejoras posteriores a los flujos críticos

| ID | Historia o tarea | Estado inicial | Criterios de aceptación |
|---|---|---|---|
| BL-23 | Como administrador quiero un historial de eventos relevantes. | Pendiente | Fuente de datos definida; eventos persistidos; consulta protegida, paginada y filtrable. |
| BL-24 | Como usuario quiero guardar rutas favoritas. | Pendiente | API y UI sincronizadas; no admite duplicados por usuario/ruta; permite listar y eliminar propias. |
| BL-25 | Como usuario quiero filtros y búsquedas avanzadas. | Pendiente | Parámetros validados, paginación consistente y consultas indexadas. |
| BL-26 | Como operador quiero respaldar y restaurar datos. | En revisión | Script genera respaldo verificable; procedimiento de restauración documentado y probado. |
| BL-27 | Como equipo quiero observabilidad operativa. | Pendiente | Logs estructurados sin secretos; correlación de errores; política de rotación documentada. |

## P3: evolución futura

| ID | Historia o tarea | Estado inicial | Criterios para incorporarla |
|---|---|---|---|
| BL-28 | Compartir ubicación en tiempo real. | Pendiente | Evaluación de privacidad, consentimiento, caducidad, API y canal en tiempo real aprobados. |
| BL-29 | Notificaciones push o en tiempo real. | Pendiente | Eventos, destinatarios, proveedor, reintentos y preferencias definidos. |
| BL-30 | Aplicación móvil. | Pendiente | Primera versión web estable y necesidades móviles validadas con usuarios. |
| BL-31 | Integración con autoridades. | Pendiente | Convenio, canal oficial, seguridad, disponibilidad y responsabilidad institucional definidos. |
| BL-32 | Recomendación dinámica de rutas por riesgo. | Pendiente | Datos suficientes, fórmula explicable y proceso de validación establecidos. |

## Orden de ejecución recomendado

1. BL-08, BL-09 y BL-10: establecer una base técnica reproducible.
2. BL-01, BL-02 y BL-03: cerrar identidad, sesión y permisos.
3. BL-04, BL-05, BL-06 y BL-19: completar los flujos de incidentes y emergencia.
4. BL-07, BL-14, BL-15 y BL-16: integrar mapa, evidencias y puntos de apoyo.
5. BL-11, BL-12, BL-13, BL-17 y BL-18: completar gestión y administración.
6. BL-20, BL-21 y BL-22: asegurar calidad, accesibilidad y despliegue.

## Definición de terminado por elemento

Un elemento puede pasar a **Hecho** únicamente cuando:

- El código está integrado sin errores de compilación o análisis estático.
- Los criterios de aceptación fueron ejecutados y existe evidencia.
- Se validaron autenticación, autorización y manejo de errores cuando aplican.
- Frontend, API y base de datos están sincronizados cuando el flujo utiliza las tres capas.
- OpenAPI y documentación se actualizaron si cambió una interfaz pública.
- No quedan defectos bloqueantes asociados al elemento.
