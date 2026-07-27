# Planificación del proyecto SafeWalk U

## 1. Información general

**Proyecto:** SafeWalk U  
**Tipo:** Aplicación web responsive para seguridad universitaria  
**Enfoque de interfaz:** Mobile-first, optimizada para celulares y adaptable a tabletas y escritorio  
**Equipo:** Milena Ordoñez
**Duración propuesta:** 8 semanas  
**Metodología:** Desarrollo iterativo mediante sprints semanales

SafeWalk U busca fortalecer la seguridad de los estudiantes universitarios mediante rutas seguras, reportes colaborativos de incidentes, evidencias multimedia, contactos de emergencia y puntos de apoyo cercanos.

## 2. Objetivo general

Desarrollar e implementar una aplicación web responsive, segura y fácil de usar, priorizando la experiencia desde celulares, que permita a estudiantes y administradores gestionar incidentes, consultar rutas y lugares seguros, compartir información relevante y responder de manera oportuna ante situaciones de riesgo.

## 3. Objetivos específicos

- Implementar registro, inicio de sesión y autorización por roles.
- Permitir la creación, consulta, actualización y eliminación lógica de reportes.
- Gestionar evidencias asociadas a incidentes.
- Mostrar rutas, ubicaciones y lugares seguros en un mapa interactivo.
- Facilitar el acceso a contactos y servicios de emergencia.
- Proporcionar un panel administrativo con indicadores y gestión de usuarios.
- Diseñar la experiencia con enfoque mobile-first, controles táctiles accesibles y adaptación progresiva a pantallas mayores.
- Gestionar correctamente los permisos de geolocalización y los escenarios en que el usuario los rechace o no estén disponibles.
- Mantener los flujos críticos utilizables bajo conexiones móviles lentas o intermitentes.
- Documentar la API mediante OpenAPI y Swagger.
- Validar la seguridad, estabilidad y usabilidad del sistema antes de desplegarlo.

## 4. Alcance funcional

### Módulo del estudiante

- Registro e inicio de sesión.
- Consulta y edición del perfil.
- Visualización del mapa interactivo.
- Consulta y selección de rutas seguras.
- Creación y seguimiento de reportes de incidentes.
- Carga de evidencias multimedia.
- Gestión de contactos de apoyo.
- Acceso a la función de emergencia SOS.
- Consulta del historial de notificaciones.

### Módulo administrativo

- Inicio de sesión con rol de administrador.
- Visualización de indicadores generales.
- Gestión de usuarios y permisos.
- Revisión y administración de reportes.
- Gestión de rutas, ubicaciones, lugares seguros y servicios de emergencia.
- Supervisión del estado general de la plataforma.

### Servicios del backend

- API REST desarrollada con Node.js, Express y TypeScript.
- Arquitectura por controladores, servicios y repositorios.
- Persistencia de datos en MySQL.
- Autenticación JWT y autorización por roles.
- Validación de entradas con Zod.
- Hash seguro de contraseñas con bcrypt.
- Rate limiting y manejo centralizado de errores.
- Documentación con OpenAPI 3.0 y Swagger.

### Experiencia responsive y móvil

- Diseño mobile-first desde un ancho de referencia mínimo de 320 px.
- Adaptación de la interfaz para celulares, tabletas y computadoras sin pérdida de funcionalidad.
- Navegación sencilla con una mano y acciones críticas accesibles con pocos pasos.
- Áreas táctiles de al menos 44 × 44 px para botones y controles interactivos importantes.
- Botón SOS visible y fácil de alcanzar, acompañado de una confirmación para evitar activaciones accidentales.
- Formularios breves, teclados móviles adecuados al tipo de dato y mensajes junto al campo correspondiente.
- Solicitud contextual de geolocalización, explicando su propósito antes de pedir permiso al navegador.
- Alternativa manual cuando la ubicación no esté disponible, el permiso sea rechazado o la precisión sea insuficiente.
- Indicadores de carga, pérdida de conexión, reintento, estado vacío, éxito y error.
- Compresión y validación de imágenes para reducir el consumo de datos móviles antes de cargar evidencias.
- Compatibilidad objetivo con Chrome y Firefox en Android, y Safari en iOS.
- Respeto por áreas seguras del dispositivo, orientación vertical y horizontal, zoom y tamaño de texto del usuario.

La versión inicial será una web responsive y no una aplicación móvil nativa. La geolocalización funcionará mientras la web esté abierta y tenga permiso; el seguimiento continuo en segundo plano queda fuera del alcance inmediato por las restricciones de los navegadores móviles.

## 5. Estado actual identificado

El repositorio ya contiene una base funcional importante:

- Backend estructurado por capas.
- Esquema y datos iniciales de MySQL.
- Endpoints para autenticación, usuarios, reportes, rutas, evidencias, ubicaciones y otros recursos.
- Middleware de autenticación, autorización, validación y control de errores.
- Contrato OpenAPI y documentación Swagger.
- Frontend en React y Vite con vistas para estudiantes y administradores.
- Componentes de mapa, reportes, contactos, SOS, perfiles y panel administrativo.
- Configuración de Docker, Nginx, PM2 y despliegue.

La planificación se enfoca en integrar, verificar y completar estos componentes hasta obtener una versión estable.

## 6. Plan de trabajo

| Fase | Semana | Actividades principales | Entregable |
|---|---:|---|---|
| Análisis y organización | 1 | Revisar requisitos, casos de uso, alcance, roles, modelo de datos y estructura del repositorio. Crear backlog y priorizar funcionalidades. | **Completada:** `docs/FASE_1_ANALISIS.md` y `BACKLOG.md` |
| Base de datos y backend base | 2 | Validar esquema 3FN, relaciones, datos iniciales, variables de entorno, conexión MySQL y estructura Controller-Service-Repository. | **Completada:** `docs/FASE_2_BASE_DATOS_BACKEND.md`; MySQL verificado |
| Seguridad y usuarios | 3 | Verificar registro, login, JWT, bcrypt, autorización por roles, validaciones Zod, perfil y gestión de usuarios. | **Completada:** `docs/FASE_3_SEGURIDAD_USUARIOS.md` |
| Reportes y evidencias | 4 | Completar CRUD de reportes, estados, eliminación lógica, carga de archivos, asociación de evidencias y manejo de errores. | **Completada:** `docs/FASE_4_REPORTES_EVIDENCIAS.md` |
| Rutas y servicios de seguridad | 5 | Integrar rutas, ubicaciones, coordenadas, lugares seguros, contactos, servicios de emergencia y función SOS. Definir solicitud de geolocalización y alternativa manual. | **Completada:** `docs/FASE_5_RUTAS_SERVICIOS.md` |
| Integración del frontend | 6 | Conectar las vistas React con la API, controlar sesión y permisos, gestionar estados de carga/error y aplicar el diseño mobile-first en todos los flujos críticos. | **Completada:** `docs/FASE_6_INTEGRACION_FRONTEND.md` |
| Pruebas y calidad | 7 | Ejecutar pruebas funcionales, de integración, seguridad, permisos, accesibilidad táctil, geolocalización, conectividad lenta y tamaños de pantalla. Corregir incidencias. | **Completada:** automatización, recorridos por rol y matriz Chrome de 320 a 1440 px; `docs/FASE_7_PRUEBAS_CALIDAD.md` y `docs/AUDITORIA_PRE_FASE_8.md` |
| Documentación y despliegue | 8 | Actualizar README, OpenAPI, variables de entorno y manual de uso. Validar compilación, Docker, Nginx, PM2, respaldo y health check. | Versión estable desplegable |

## 7. Backlog priorizado

### Prioridad alta

- Autenticación y cierre de sesión seguros.
- Protección de rutas según el rol.
- Gestión de usuarios y perfiles.
- Creación y consulta de reportes.
- Carga y consulta de evidencias.
- Visualización de rutas y puntos seguros.
- Diseño mobile-first de los flujos críticos: acceso, reporte, mapa, SOS y contactos.
- Manejo de permisos de ubicación y alternativa de ingreso manual.
- Uso correcto en pantallas desde 320 px y controles táctiles accesibles.
- Validación de datos y respuestas de error consistentes.
- Conexión estable entre frontend, backend y base de datos.

### Prioridad media

- Contactos de emergencia y función SOS.
- Historial de notificaciones.
- Panel administrativo e indicadores.
- Filtros y búsquedas de reportes, usuarios y rutas.
- Optimización y compresión de evidencias para conexiones móviles.
- Mejoras de accesibilidad más allá de los flujos críticos.

### Prioridad baja o evolución futura

- Notificaciones en tiempo real.
- Geolocalización y seguimiento en vivo.
- Recomendación automática de rutas según nivel de riesgo.
- Aplicación móvil.
- Integración con servicios institucionales o autoridades.

## 8. Distribución sugerida de responsabilidades

| Área | Responsable principal | Responsabilidades |
|---|---|---|
| Backend y seguridad | Integrante 1 | API, autenticación, permisos, validaciones, lógica de negocio y documentación OpenAPI |
| Frontend y experiencia de usuario | Componentes React, navegación, formularios, mapa, estados visuales y diseño responsivo |
| Base de datos | Modelo relacional, scripts, integridad, datos de prueba y consultas |
| Pruebas e integración | Casos de prueba, revisión cruzada, corrección de errores y aceptación |
| Documentación y despliegue | README, manuales, Docker, Nginx, PM2, CI/CD y presentación final |

## 9. Estrategia de pruebas

### Pruebas funcionales

- Registro e inicio de sesión con datos válidos e inválidos.
- Acceso permitido y denegado según el rol.
- Operaciones CRUD sobre los recursos principales.
- Carga de evidencias válidas y rechazo de archivos no permitidos.
- Visualización de rutas, ubicaciones y lugares seguros.
- Activación y respuesta de las funciones de emergencia.
- Solicitud, aceptación y rechazo del permiso de geolocalización.
- Selección manual de ubicación cuando la geolocalización no esté disponible.
- Confirmación y prevención de activaciones accidentales del botón SOS.

### Pruebas técnicas

- Compilación y comprobación de tipos del backend.
- Compilación y análisis estático del frontend.
- Respuestas HTTP esperadas: 200, 201, 400, 401, 403, 404, 422 y 500.
- Validación del rate limiting.
- Verificación de que las contraseñas no se almacenen ni expongan en texto plano.
- Prueba del health check y recuperación del servicio.
- Ejecución en un entorno limpio mediante Docker.
- Pruebas responsive en anchos de 320, 360, 390, 768, 1024 y 1440 px.
- Pruebas en Chrome y Firefox para Android y Safari para iOS, mediante dispositivos reales o emulación cuando sea necesario.
- Pruebas con orientación vertical y horizontal, zoom de texto y navegación mediante teclado.
- Pruebas con red móvil lenta, desconexión temporal y reintento de solicitudes.
- Verificación de áreas táctiles mínimas de 44 × 44 px en acciones importantes.

### Criterio de aceptación general

Una funcionalidad se considera terminada cuando está integrada, valida entradas, maneja errores, respeta permisos, cuenta con una prueba reproducible y está documentada cuando corresponde. Si tiene interfaz, también debe funcionar desde 320 px, ser operable mediante interacción táctil y presentar una alternativa cuando dependa de geolocalización o conectividad.

## 10. Riesgos y acciones preventivas

| Riesgo | Impacto | Acción preventiva |
|---|---|---|
| Diferencias entre el contrato OpenAPI y la implementación | Alto | Actualizar y revisar ambos en cada cambio de endpoint |
| Errores de configuración de MySQL o variables de entorno | Alto | Mantener `.env.example` actualizado y documentar la instalación |
| Permisos incorrectos entre administrador y estudiante | Alto | Crear una matriz de permisos y probar cada endpoint por rol |
| Fallos al integrar el mapa o la geolocalización | Medio | Implementar estados alternativos y validar permisos del navegador |
| Restricciones de geolocalización en segundo plano | Alto | Limitar la versión inicial al uso con la web abierta y documentar claramente esta condición |
| Interfaz difícil de usar con una mano o en pantallas pequeñas | Alto | Aplicar diseño mobile-first, probar desde 320 px y priorizar las acciones críticas |
| Conexión móvil lenta o intermitente | Alto | Mostrar progreso, conservar datos temporales de forma controlada y permitir reintentos sin duplicar operaciones |
| Incompatibilidades entre Android e iOS | Medio | Probar navegadores objetivo y evitar depender de API experimentales sin alternativa |
| Carga de archivos inseguros o demasiado grandes | Alto | Restringir tipo, extensión y tamaño; generar nombres controlados |
| Retrasos por integración tardía | Alto | Integrar frontend y backend progresivamente desde los primeros sprints |
| Problemas de despliegue | Medio | Probar Docker y scripts en un entorno limpio antes de la entrega |

## 11. Indicadores de avance

- Porcentaje de historias de usuario completadas por sprint.
- Número de endpoints implementados y verificados.
- Número de incidencias abiertas y cerradas.
- Porcentaje de flujos críticos que superan las pruebas.
- Resultado exitoso de compilación, typecheck y lint.
- Coincidencia entre API implementada y contrato OpenAPI.
- Tiempo de respuesta y disponibilidad del health check.
- Porcentaje de pantallas aprobadas en los tamaños responsive definidos.
- Porcentaje de flujos críticos completables desde celular sin ampliar la pantalla.
- Resultado de las pruebas de geolocalización, modo sin permiso y conectividad lenta.

## 12. Entregables finales

- Código fuente del frontend y backend.
- Scripts de creación y carga inicial de la base de datos.
- Archivo de variables de entorno de ejemplo.
- Contrato OpenAPI y documentación Swagger actualizados.
- Evidencias de pruebas funcionales y de seguridad.
- Manual de instalación, ejecución y despliegue.
- Manual breve de usuario y administrador.
- Aplicación compilada y lista para despliegue.
- Matriz de pruebas responsive con capturas o evidencias en celular, tableta y escritorio.
- Guía de permisos de ubicación y limitaciones de uso en navegadores móviles.
- Presentación o demostración final del proyecto.

## 13. Definición de proyecto terminado

SafeWalk U estará listo para entrega cuando los flujos críticos funcionen de extremo a extremo, los roles y permisos hayan sido comprobados, no existan errores bloqueantes, el frontend y el backend compilen correctamente, la base de datos pueda instalarse desde cero y la documentación permita ejecutar y evaluar el sistema sin conocimiento previo del repositorio. Además, los flujos de acceso, mapa, reporte, SOS, contactos y perfil deberán funcionar desde celulares de al menos 320 px, con interacción táctil, estados de conexión comprensibles y alternativas ante la falta de geolocalización.

## 14. Seguimiento de fases

| Fase | Estado | Evidencia |
|---|---|---|
| 1. Análisis y organización | Completada | `docs/FASE_1_ANALISIS.md` y `BACKLOG.md` |
| 2. Base de datos y backend base | Completada | `docs/FASE_2_BASE_DATOS_BACKEND.md` y pruebas de integración MySQL |
| 3. Seguridad y usuarios | Completada | `docs/FASE_3_SEGURIDAD_USUARIOS.md` |
| 4. Reportes y evidencias | Completada | `docs/FASE_4_REPORTES_EVIDENCIAS.md` |
| 5. Rutas y servicios de seguridad | Completada | `docs/FASE_5_RUTAS_SERVICIOS.md` |
| 6. Integración del frontend | Completada | `docs/FASE_6_INTEGRACION_FRONTEND.md` |
| 7. Pruebas y calidad | Completada; aceptación adicional en dispositivos físicos recomendada antes de producción | `docs/FASE_7_PRUEBAS_CALIDAD.md` y `docs/AUDITORIA_PRE_FASE_8.md` |
| 8. Documentación y despliegue | Completada | `docs/FASE_8_DOCUMENTACION_DESPLIEGUE.md`, manuales y despliegue Docker validado |
