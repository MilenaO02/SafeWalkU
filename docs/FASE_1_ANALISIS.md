# Fase 1: análisis y organización de SafeWalk U

## 1. Propósito del documento

Este documento formaliza el resultado de la primera fase del proyecto. Define el problema, los interesados, el alcance, los requisitos, los casos de uso, las reglas de negocio y la correspondencia entre el diseño previsto y el repositorio actual.

## 2. Problema y propuesta de valor

Los estudiantes universitarios pueden estar expuestos a zonas o trayectos inseguros y no siempre disponen de información centralizada para reportar incidentes, identificar puntos de apoyo o actuar ante una emergencia.

SafeWalk U propone una aplicación web que concentra información colaborativa de seguridad, rutas, ubicaciones, reportes y servicios de emergencia. Los estudiantes generan y consultan información; los administradores supervisan usuarios, validan incidentes y mantienen los recursos de seguridad.

## 3. Interesados y actores

| Actor o interesado | Necesidad principal | Participación en el sistema |
|---|---|---|
| Estudiante | Desplazarse con mayor información y solicitar apoyo | Consulta rutas y zonas, crea reportes, usa SOS y administra su perfil y contactos |
| Administrador | Mantener información confiable y supervisar la plataforma | Gestiona usuarios, reportes, rutas y datos de seguridad |
| Universidad | Mejorar la prevención y disponer de información organizada | Patrocina, define políticas y utiliza indicadores agregados |
| Equipo de desarrollo | Construir y mantener una solución verificable | Implementa, prueba, documenta y despliega el sistema |
| Servicios de emergencia | Ser localizables de forma rápida | Figuran como puntos y contactos de apoyo; no operan el sistema en esta versión |

### Roles internos

- `ESTUDIANTE`: accede a las funciones personales y colaborativas de seguridad.
- `ADMINISTRADOR`: accede a las funciones de supervisión y mantenimiento, además de las consultas generales autorizadas.

No se contempla el registro público de administradores. La asignación de ese rol debe realizarse mediante un procedimiento controlado.

## 4. Alcance acordado

### Incluido en la primera versión

- Registro e inicio de sesión de estudiantes.
- Sesión autenticada con JWT y protección por roles.
- Consulta y actualización del perfil, incluida la foto.
- Gestión administrativa de usuarios.
- Creación y consulta de reportes de incidentes.
- Revisión, cambio de estado y desactivación de reportes por administradores.
- Asociación de evidencias a reportes.
- Consulta de zonas de riesgo.
- Consulta y trazado de rutas seguras.
- Administración de rutas por administradores.
- Consulta de ubicaciones, lugares seguros y servicios de emergencia.
- Gestión de contactos personales de emergencia.
- Creación y cancelación de alertas SOS.
- Panel administrativo con métricas.
- Documentación de la API y despliegue reproducible.

### Fuera de alcance de la primera versión

- Aplicaciones móviles nativas.
- Comunicación directa y automática con ECU 911, Policía u otras instituciones.
- Monitoreo permanente en segundo plano.
- Chat, videollamadas o llamadas VoIP.
- Predicción de delitos mediante inteligencia artificial.
- Navegación GPS giro a giro.
- Moderación automática de imágenes o videos.
- Garantía de respuesta física ante una alerta.

### Evolución posterior

- Compartir ubicación en tiempo real con contactos autorizados.
- Rutas favoritas sincronizadas con la cuenta.
- Notificaciones push o en tiempo real.
- Cálculo dinámico de riesgo con información histórica.
- Integraciones institucionales auditadas.

## 5. Requisitos funcionales

### Autenticación y usuarios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema permitirá registrar un estudiante con información válida y correo único. | Must |
| RF-02 | El sistema permitirá iniciar sesión y entregará una sesión JWT válida. | Must |
| RF-03 | El sistema bloqueará recursos protegidos cuando no exista una sesión válida. | Must |
| RF-04 | El sistema restringirá las operaciones administrativas según el rol. | Must |
| RF-05 | El usuario podrá consultar y actualizar sus datos de perfil. | Must |
| RF-06 | El usuario podrá cargar o reemplazar su foto de perfil bajo restricciones de archivo. | Should |
| RF-07 | El administrador podrá listar, consultar, modificar y desactivar usuarios. | Must |

### Reportes, riesgos y evidencias

| ID | Requisito | Prioridad |
|---|---|---|
| RF-08 | El usuario autenticado podrá crear un reporte asociado a una ubicación. | Must |
| RF-09 | El usuario autenticado podrá consultar reportes y su detalle según las reglas de visibilidad. | Must |
| RF-10 | El administrador podrá validar, rechazar o marcar como duplicado un reporte. | Must |
| RF-11 | El administrador podrá desactivar un reporte mediante borrado lógico. | Must |
| RF-12 | El usuario podrá asociar evidencias válidas a un reporte. | Must |
| RF-13 | El sistema mostrará zonas de riesgo derivadas de reportes activos. | Must |
| RF-14 | El sistema conservará la relación entre el autor, la ubicación y la revisión administrativa. | Must |

### Rutas y puntos de apoyo

| ID | Requisito | Prioridad |
|---|---|---|
| RF-15 | El usuario autenticado podrá consultar rutas y sus puntos ordenados. | Must |
| RF-16 | El sistema permitirá solicitar un trazado de ruta con los parámetros admitidos. | Must |
| RF-17 | El administrador podrá crear, actualizar y eliminar rutas. | Should |
| RF-18 | El usuario podrá buscar ubicaciones. | Should |
| RF-19 | El usuario podrá consultar lugares seguros y servicios de emergencia. | Must |

### Emergencia y contactos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | El usuario podrá registrar, consultar y eliminar sus contactos de emergencia. | Must |
| RF-21 | El usuario podrá generar una alerta SOS asociada a su identidad y ubicación. | Must |
| RF-22 | El usuario podrá cancelar una alerta SOS propia activa. | Must |
| RF-23 | El usuario podrá compartir temporalmente su ubicación con un contacto autorizado. | Could |

### Administración y comunicación

| ID | Requisito | Prioridad |
|---|---|---|
| RF-24 | El administrador podrá consultar métricas generales del sistema. | Should |
| RF-25 | El usuario recibirá mensajes claros sobre éxito, validación, falta de permisos y errores. | Must |
| RF-26 | El administrador podrá revisar un historial de eventos o notificaciones relevantes. | Could |

## 6. Requisitos no funcionales

| ID | Categoría | Requisito verificable |
|---|---|---|
| RNF-01 | Seguridad | Las contraseñas se almacenarán con hash bcrypt y nunca se devolverán en respuestas. |
| RNF-02 | Seguridad | Toda operación privada exigirá JWT y toda operación administrativa validará el rol en el backend. |
| RNF-03 | Seguridad | Las entradas se validarán antes de alcanzar la lógica de negocio y las cargas limitarán tipo y tamaño. |
| RNF-04 | Seguridad | La API aplicará rate limiting y una política CORS configurable por entorno. |
| RNF-05 | Rendimiento | En condiciones normales de prueba, las consultas comunes deberán responder en menos de 2 segundos. |
| RNF-06 | Disponibilidad | El backend expondrá `/api/health` para comprobar servicio y base de datos. |
| RNF-07 | Usabilidad | La interfaz será responsiva y mostrará estados de carga, vacío, éxito y error. |
| RNF-08 | Accesibilidad | Formularios y acciones críticas tendrán etiquetas, foco visible y uso posible mediante teclado. |
| RNF-09 | Mantenibilidad | El backend conservará la separación Controller-Service-Repository y TypeScript estricto. |
| RNF-10 | Compatibilidad | La aplicación soportará las versiones actuales de Chrome, Edge y Firefox. |
| RNF-11 | Datos | El esquema podrá crearse desde cero mediante scripts versionados y datos iniciales controlados. |
| RNF-12 | Operación | Frontend, backend y MySQL podrán iniciarse mediante la configuración Docker del repositorio. |
| RNF-13 | Privacidad | Solo se recopilarán datos necesarios y la información personal se limitará al propietario y roles autorizados. |
| RNF-14 | Trazabilidad | Los endpoints públicos del proyecto estarán reflejados en OpenAPI y vinculados con sus requisitos. |

## 7. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Cada correo identifica de manera única a un usuario. |
| RN-02 | Un usuario inactivo no debe poder iniciar ni mantener una sesión operativa. |
| RN-03 | Un estudiante no puede ejecutar acciones reservadas al administrador. |
| RN-04 | Un reporte tiene un nivel de riesgo `BAJO`, `MEDIO` o `ALTO`. |
| RN-05 | Un reporte inicia como `PENDIENTE` y solo un administrador puede resolver su estado de revisión. |
| RN-06 | La eliminación de usuarios y reportes debe preservar la trazabilidad mediante estado inactivo cuando aplique. |
| RN-07 | Una evidencia debe pertenecer a un reporte existente. |
| RN-08 | Una ruta se compone de ubicaciones ordenadas y posee nivel de seguridad y tiempo estimado. |
| RN-09 | Un contacto de emergencia pertenece a un usuario; otro usuario no puede modificarlo. |
| RN-10 | Una alerta SOS debe identificarse como `SOS_PANICO` y poder cancelarse sin eliminar su registro histórico. |
| RN-11 | Las coordenadas deben encontrarse en los intervalos geográficos válidos. |
| RN-12 | La asignación del rol administrador no puede depender de datos manipulables por un registro público. |

## 8. Casos de uso principales

| ID | Caso de uso | Actor | Resultado esperado |
|---|---|---|---|
| CU-01 | Registrarse | Estudiante | Cuenta activa creada con credenciales protegidas |
| CU-02 | Iniciar sesión | Estudiante/Administrador | Token y datos mínimos de sesión obtenidos |
| CU-03 | Editar perfil | Estudiante/Administrador | Datos propios actualizados |
| CU-04 | Administrar usuarios | Administrador | Usuarios consultados, actualizados o desactivados |
| CU-05 | Reportar incidente | Estudiante/Administrador | Reporte pendiente creado y asociado a una ubicación |
| CU-06 | Revisar reporte | Administrador | Estado del reporte actualizado con trazabilidad |
| CU-07 | Adjuntar evidencia | Estudiante/Administrador | Evidencia válida asociada al reporte correspondiente |
| CU-08 | Consultar zonas de riesgo | Estudiante/Administrador | Zonas activas presentadas en el mapa |
| CU-09 | Consultar o trazar ruta | Estudiante/Administrador | Alternativa de ruta y puntos ordenados presentados |
| CU-10 | Mantener rutas | Administrador | Catálogo de rutas actualizado |
| CU-11 | Gestionar contactos | Estudiante/Administrador | Contactos propios registrados o eliminados |
| CU-12 | Activar SOS | Estudiante/Administrador | Alerta activa registrada con ubicación |
| CU-13 | Cancelar SOS | Estudiante/Administrador | Alerta propia finalizada o cancelada conservando historial |
| CU-14 | Consultar puntos de apoyo | Estudiante/Administrador | Lugares y servicios relevantes visibles |
| CU-15 | Consultar métricas | Administrador | Resumen operativo mostrado en el panel |

### Flujo crítico CU-05: reportar incidente

1. El usuario inicia sesión.
2. Accede al formulario de reporte.
3. Ingresa descripción, nivel de riesgo y ubicación.
4. El sistema valida la información.
5. El usuario confirma el resumen.
6. El backend obtiene la identidad desde la sesión y registra el reporte como pendiente.
7. El sistema confirma la creación y muestra el identificador del reporte.

**Alternativas:** datos inválidos, ubicación inexistente, token vencido o fallo de conexión. En todos los casos se informa el problema sin crear registros parciales.

### Flujo crítico CU-12: activar SOS

1. El usuario autenticado pulsa la acción SOS.
2. La interfaz solicita confirmación para evitar activaciones accidentales.
3. Se obtiene o selecciona una ubicación válida.
4. El backend registra un reporte de tipo `SOS_PANICO`.
5. La interfaz muestra el estado activo y permite cancelarlo.

**Restricción:** la aplicación registra y comunica la alerta dentro de su alcance; no debe afirmar que una autoridad externa recibió la solicitud si no existe una integración comprobada.

## 9. Modelo de información validado

El esquema actual contiene 13 entidades:

| Entidad | Responsabilidad | Relaciones relevantes |
|---|---|---|
| `usuario` | Identidad, credenciales, rol y estado | Origina reportes, contactos y rutas favoritas |
| `administrador` | Extensión del usuario administrador | Revisa reportes |
| `ubicacion` | Punto o zona con dirección y tipo | Posee coordenada; se usa en reportes, rutas y puntos de apoyo |
| `coordenada` | Latitud y longitud de una ubicación | Relación uno a uno con ubicación |
| `reporte` | Incidente o alerta SOS | Pertenece a usuario y ubicación; admite evidencias y revisión |
| `evidencia` | Imagen o video de respaldo | Pertenece a un reporte |
| `contactoemergencia` | Persona de apoyo del usuario | Puede recibir una sesión de ubicación compartida |
| `servicioemergencia` | Policía, UPC, bomberos u hospital | Está asociado a una ubicación |
| `lugarseguro` | Punto de apoyo identificado | Está asociado a una ubicación |
| `compartirubicacion` | Sesión temporal de ubicación compartida | Une usuario y contacto |
| `ruta` | Trayecto con nivel y duración | Se compone de ubicaciones |
| `ruta_ubicacion` | Orden de puntos de una ruta | Une ruta y ubicación |
| `rutafavorita` | Ruta guardada por un usuario | Une usuario y ruta |

El modelo cubre el dominio definido y mantiene relaciones normalizadas. En fases posteriores se deben revisar restricciones únicas para evitar rutas favoritas duplicadas y múltiples sesiones activas incompatibles, además de precisar cómo se actualiza la posición durante una sesión compartida.

## 10. Arquitectura y estructura verificadas

```text
React/Vite
    |
    | HTTP + JWT
    v
Express/TypeScript
    |
    +-- Routes -> Middleware -> Controllers -> Services -> Repositories
                                                        |
                                                        v
                                                      MySQL
```

- `frontend/src/components` contiene las funciones visuales del estudiante y administrador.
- `frontend/src/context` mantiene la sesión del cliente.
- `frontend/src/services` contiene el cliente HTTP común.
- `backend/src/routes` define la superficie REST.
- `backend/src/middleware` aplica autenticación, autorización, validación y errores.
- `backend/src/controllers`, `services` y `repositories` separan transporte, negocio y persistencia.
- `backend/db` contiene el esquema y los datos iniciales.
- Docker Compose integra MySQL, backend y frontend.

## 11. Matriz resumida de permisos

| Capacidad | Visitante | Estudiante | Administrador |
|---|:---:|:---:|:---:|
| Registro e inicio de sesión | Sí | Sí | Sí |
| Editar perfil propio | No | Sí | Sí |
| Consultar rutas y zonas | No | Sí | Sí |
| Crear reporte o SOS | No | Sí | Sí |
| Gestionar contactos propios | No | Sí | Sí |
| Cambiar estado de reportes | No | No | Sí |
| Gestionar usuarios | No | No | Sí |
| Mantener rutas | No | No | Sí |
| Consultar métricas administrativas | No | No | Sí |

## 12. Hallazgos de la auditoría

1. El backend ya expone módulos de autenticación, usuarios, reportes, evidencias, rutas, ubicaciones, dashboard, contactos, servicios y lugares.
2. El frontend ya define pantallas y navegación para los flujos principales.
3. El cliente HTTP del frontend centraliza login, registro y health check, pero varias integraciones funcionales todavía deben comprobarse o consolidarse.
4. El formulario de reporte utiliza almacenamiento local temporal antes de confirmar; se debe verificar la persistencia real contra la API en la fase de integración.
5. Las tablas `compartirubicacion` y `rutafavorita` existen, pero no se observaron módulos REST equivalentes en el backend auditado.
6. La vista de historial de notificaciones existe, pero el esquema no contiene una entidad explícita de notificación.
7. Las rutas de evidencias manejan metadatos validados; debe verificarse que el flujo real de carga multimedia esté alineado con Multer y con el contrato OpenAPI.
8. El contrato OpenAPI y las anotaciones Swagger deben compararse con las rutas implementadas porque se observan prefijos inconsistentes en algunos comentarios.
9. La fase siguiente debe validar el esquema desde cero, sus restricciones y la correspondencia entre `schema.sql`, `seed.sql` y los repositorios.

## 13. Decisiones de la fase 1

- La primera versión se centra en los flujos críticos existentes y no promete integración automática con autoridades.
- Compartir ubicación, rutas favoritas y notificaciones avanzadas quedan como evolución hasta que exista diseño API y criterio de privacidad.
- La identidad del autor de operaciones sensibles debe obtenerse del JWT, no confiarse a un identificador enviado libremente por el cliente.
- Los criterios de aceptación y la prioridad oficial de implementación quedan establecidos en `BACKLOG.md`.
- Cada fase posterior deberá actualizar el estado del backlog y aportar evidencia verificable.

## 14. Criterios de salida de la fase 1

- [x] Problema, propósito y actores identificados.
- [x] Alcance incluido y excluido definido.
- [x] Requisitos funcionales y no funcionales enumerados.
- [x] Roles y permisos documentados.
- [x] Casos de uso principales definidos.
- [x] Modelo de datos y arquitectura revisados.
- [x] Brechas del repositorio registradas.
- [x] Backlog priorizado creado.

