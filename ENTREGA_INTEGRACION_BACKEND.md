# SafeWalk U — Integración de servicios backend

## 1. Tema

Avance del proyecto SafeWalk U enfocado en la integración del frontend React con los servicios REST desarrollados en Node.js, Express y TypeScript, incluyendo autenticación JWT, persistencia MySQL y despliegue productivo mediante Nginx y PM2.

## 2. Objetivo

Comprobar mediante flujos reales que la interfaz web de SafeWalk U consume los endpoints del backend a través de HTTPS, procesa sus respuestas y persiste la información en la base de datos MySQL `safewalku`.

## 3. Introducción

SafeWalk U es un sistema web responsive orientado a la seguridad de estudiantes universitarios. La aplicación permite iniciar sesión, registrar usuarios, consultar ubicaciones, gestionar contactos de emergencia, crear reportes con evidencias, consultar rutas y registrar alertas SOS. Además, dispone de un modo administrativo para revisar reportes, atender alertas y gestionar usuarios.

La revisión se realizó sobre el proyecto existente y sobre el dominio productivo `https://safewalku.online`. No se creó un frontend o backend alternativo ni se utilizaron respuestas simuladas para validar los flujos descritos.

## 4. Arquitectura de integración

```text
Navegador del usuario
        ↓ HTTPS
https://safewalku.online
        ↓
Nginx
  ├── React/Vite (archivos estáticos)
  └── /api/* → http://127.0.0.1:3000/api/*
                         ↓
              Express + TypeScript
                         ↓
 Controller → Service → Repository
                         ↓
                    MySQL
                 BD: safewalku
```

El frontend utiliza rutas relativas `/api/...`, por lo que no depende de `localhost` en el navegador de producción. Las peticiones protegidas incorporan el encabezado `Authorization: Bearer [TOKEN OCULTO]`.

## 5. Mapa de los flujos principales

| Funcionalidad | Componente frontend | Servicio | Endpoint | Backend | Persistencia |
|---|---|---|---|---|---|
| Inicio de sesión | Pantalla de acceso | `services/api` | `POST /api/auth/login` | Auth route → controller → service → user repository | `usuario` y roles |
| Registro | Formulario de registro | `services/api` | `POST /api/auth/register` | Auth route → controller → service → user repository | `usuario` |
| Perfil | Perfil | `services/api` | `GET /api/users/me` | User route → controller → service → repository | `usuario` |
| Foto de perfil | Perfil | `services/api` | `PUT /api/users/:id/foto` | User route → controller → service → repository | `usuario.foto_perfil` |
| Reporte | `ReportarIncidente.jsx` | `services/api` | `POST /api/reports` | Report route → controller → service → repository | `reporte` |
| Contactos | `ListaContactosApoyo.jsx` | `services/api` | `GET/POST /api/contacts` | Contact route → controller → service → repository | `contactoemergencia` |
| Ruta segura | `BuscadorPrincipal.jsx` | `services/api` | `GET /api/routes/trazar` | Route route → controller → service → repository | rutas y ubicaciones |
| Crear SOS | `EmergenciaSos.jsx` | `services/api` | `POST /api/reports/sos` | Report route → controller → service → repository | `reporte` tipo `SOS_PANICO` |
| Atender SOS | `AdminDashboard.jsx` | `services/api` | `PUT /api/reports/sos/:id/atender` | Report route → controller → service → repository | `reporte.estado` e `id_administrador` |

## 6. Servicios y endpoints comprobados

| Funcionalidad | Método | Endpoint | Solicitud | Respuesta | HTTP | Resultado |
|---|---|---|---|---|---:|---|
| Salud de API | GET | `/api/health` | Sin body | API `online`, BD `connected` | 200 | Correcto |
| Inicio de sesión | POST | `/api/auth/login` | correo y contraseña | token y usuario | 200 | Correcto |
| Registro | POST | `/api/auth/register` | nombre, apellido, correo y contraseña | usuario registrado | 201 | Correcto |
| Usuario autenticado | GET | `/api/users/me` | Bearer token | datos del usuario | 200 | Correcto |
| Foto de perfil | PUT | `/api/users/27/foto` | `multipart/form-data` | ruta de foto actualizada | 200 | Correcto |
| Listar ubicaciones | GET | `/api/ubicaciones` | Bearer token | ubicaciones | 200 | Correcto |
| Listar reportes | GET | `/api/reports` | Bearer token | reportes permitidos por rol | 200 | Correcto |
| Zonas de riesgo | GET | `/api/reports/zonas/riesgo?ciudad=Loja` | ciudad | zonas activas | 200 | Correcto |
| Crear reporte | POST | `/api/reports` | descripción, riesgo, tipo y ubicación | reporte creado | 201 | Correcto |
| Eliminar evidencia propia | DELETE | `/api/evidencias/25` | Bearer token | confirmación JSON | 200 | Correcto |
| Desactivar reporte como estudiante | DELETE | `/api/reports/31` | Bearer estudiante | mensaje sin permisos | 403 | Control de rol correcto |
| Desactivar reporte como administrador | DELETE | `/api/reports/31` | Bearer administrador | confirmación JSON | 200 | Correcto |
| Listar contactos | GET | `/api/contacts` | Bearer token | contactos del usuario | 200 | Correcto |
| Crear contacto | POST | `/api/contacts` | nombre, teléfono y parentesco | contacto creado | 201 | Correcto |
| Trazar ruta | GET | `/api/routes/trazar?origen_lat=...&origen_lng=...&destino_id=9` | coordenadas y destino | ruta calculada/referencial | 200 | Correcto |
| Métricas | GET | `/api/dashboard/metricas` | Bearer administrador | métricas actuales | 200 | Correcto |
| Crear alerta SOS | POST | `/api/reports/sos` | descripción e `id_ubicacion` | `SOS Activado` | 201 definido; flujo real correcto | Correcto |
| Atender alerta SOS | PUT | `/api/reports/sos/:id/atender` | Bearer administrador | alerta atendida | 200 definido; flujo real correcto | Correcto |

Los códigos del flujo SOS están definidos explícitamente en `report.controller.ts`. La creación y atención se comprobaron en producción por medio de la interfaz y se volvieron a consultar después de recargar el dashboard.

## 7. Intercambio de información HTTP/HTTPS

Las solicitudes se realizan en formato JSON, excepto la carga de fotografía, que emplea `multipart/form-data`. El backend responde con JSON y utiliza códigos HTTP según el resultado. En las rutas protegidas se envía el JWT mediante el encabezado `Authorization`.

Ejemplo de creación de SOS:

```http
POST https://safewalku.online/api/reports/sos
Content-Type: application/json
Authorization: Bearer [TOKEN OCULTO]

{
  "descripcion": "Alerta SOS activada desde la web móvil",
  "id_ubicacion": 1
}
```

Respuesta definida por el backend:

```json
{
  "success": true,
  "message": "SOS Activado",
  "data": {
    "id_reporte": "[ID GENERADO]"
  }
}
```

## 8. Autenticación y autorización JWT

El registro valida la información y almacena la contraseña como hash bcrypt. El inicio de sesión consulta MySQL, compara la contraseña y genera un JWT. El frontend conserva el token según la opción de mantener sesión y lo adjunta a las solicitudes posteriores.

Se verificaron los siguientes controles:

- Petición protegida con token válido: respuesta satisfactoria.
- Token inválido o vencido: `401 Unauthorized` y cierre controlado de la sesión.
- Operación administrativa con rol de estudiante: `403 Forbidden`.
- Cambio entre modo estudiante y modo administrador para la cuenta autorizada.
- El JWT no se debe mostrar completo en capturas ni documentos.

## 9. Persistencia MySQL

Se obtuvieron evidencias de persistencia para:

- Registro del usuario institucional con `id_usuario = 27`.
- Foto de perfil guardada en `usuario.foto_perfil`.
- Reporte creado con `id_reporte = 31` y evidencia asociada.
- Contacto creado con `id_contacto = 25`.
- Eliminación de la evidencia y desactivación lógica del reporte.
- Alerta SOS creada y posteriormente atendida. Después de recargar el dashboard, el sistema continuó mostrando cero SOS pendientes y dos reportes validados, lo que confirmó que no era únicamente un cambio visual local.

Consulta recomendada para la captura final del SOS:

```sql
SELECT
    id_reporte,
    descripcion,
    nivel_riesgo,
    estado,
    tipo_reporte,
    id_usuario,
    id_ubicacion,
    id_administrador,
    fecha_reporte,
    estado_registro
FROM reporte
WHERE id_usuario = 27
  AND tipo_reporte = 'SOS_PANICO'
ORDER BY id_reporte DESC
LIMIT 1;
```

El resultado esperado debe mostrar `tipo_reporte = SOS_PANICO`, `estado = VALIDADO`, `id_usuario = 27`, un `id_administrador` asignado y `estado_registro = ACTIVO`.

## 10. Producción: Nginx, PM2 y dominio

- Dominio comprobado: `https://safewalku.online`.
- Nginx publica el frontend y redirige `/api/*` a `127.0.0.1:3000`.
- PM2 ejecuta `dist/server.js` como `safewalk-backend`.
- El health check respondió con API en línea y base conectada.
- La aplicación continuó funcionando después de reiniciar/restaurar el proceso PM2.
- El servidor EC2 quedó con aproximadamente 1.4 GB disponibles y 80 % de uso de disco después de la limpieza autorizada.

PM2 en estado `online` no fue la única evidencia: también se probaron endpoints reales en el dominio.

## 10.1 Contrato API y seguridad

- OpenAPI 3.0.3 sincronizado entre el contrato fuente y `backend/openapi.yaml`.
- 30 rutas y 44 operaciones documentadas con método, parámetros, body, seguridad, roles y respuestas.
- Se incorporó al contrato `POST /auth/switch-role`, que antes no aparecía en la documentación publicada.
- El registro ya no documenta un rol enviado por el cliente ni contraseñas débiles de demostración.
- Express confía únicamente en un proxy Nginx para interpretar correctamente la IP usada por el rate limiting.
- Se deshabilitó la cabecera informativa `X-Powered-By`.
- Los intentos fallidos de autenticación se limitan a 10 cada cinco minutos; los accesos correctos no consumen este límite.

## 11. Pruebas y resultados

| Prueba | Resultado observado |
|---|---|
| Login y almacenamiento de sesión | Correcto |
| Consumo de rutas protegidas | Correcto |
| Registro y consulta posterior en MySQL | Correcto |
| Creación de reporte y respuesta 201 | Correcto |
| Persistencia de reporte y evidencia | Correcto |
| Contacto GET/POST y visualización | Correcto |
| Ruta segura GET y visualización en mapa | Correcto |
| Creación de SOS en estudiante | Correcto |
| Visualización del SOS pendiente en administrador | Correcto |
| Atención del SOS | Correcto |
| Recarga posterior al SOS atendido | Correcto, se mantuvo en cero pendientes |
| Errores de consola durante la prueba SOS | Ninguno |

## 12. Capturas mínimas para entregar

### CAPTURA 1 — Aplicación en producción

**Dónde tomarla:** `https://safewalku.online/login` o una vista autenticada.  
**Qué debe aparecer:** dominio HTTPS visible y la interfaz de SafeWalk U.  
**Qué resaltar:** dominio y candado HTTPS.  
**Endpoint demostrado:** documento principal del frontend.  
**Código esperado:** 200.

**Descripción para el informe:** “SafeWalk U se encuentra desplegado en el dominio productivo con conexión HTTPS y una interfaz web responsive accesible desde el navegador.”

### CAPTURA 2 — Login y respuesta

**Dónde tomarla:** DevTools → Network → Fetch/XHR.  
**Acción:** iniciar sesión y seleccionar la solicitud `login`.  
**Qué debe aparecer:** `POST /api/auth/login`, estado 200 y respuesta JSON.  
**Qué ocultar:** contraseña y token JWT.  

**Descripción para el informe:** “El frontend envió las credenciales mediante una solicitud POST y procesó la respuesta 200 del servicio de autenticación para iniciar una sesión protegida mediante JWT.”

### CAPTURA 3 — Registro y persistencia

**Dónde tomarla:** una captura de Network del `POST /api/auth/register` 201 y otra de MySQL.  
**Qué debe aparecer en MySQL:** usuario institucional `miordonezle@uide.edu.ec`, `id_usuario = 27`, rol estudiante, estado activo y fecha de registro.  
**Qué ocultar:** contraseña/hash.

**Descripción para el informe:** “El usuario registrado desde el frontend fue insertado en MySQL, comprobando el flujo interfaz → API → repositorio → base de datos.”

### CAPTURA 4 — Creación de reporte

**Dónde tomarla:** DevTools → Network, solicitud `reports`.  
**Qué debe aparecer:** `POST /api/reports`, 201 Created y JSON con el reporte generado.  
**Endpoint:** `/api/reports`.

**Descripción para el informe:** “La interfaz consumió el endpoint de reportes mediante POST; el backend validó la solicitud, creó el registro y devolvió HTTP 201 con la información persistida.”

### CAPTURA 5 — Persistencia del reporte

**Dónde tomarla:** MySQL con el resultado del reporte creado.  
**Qué debe aparecer:** `id_reporte = 31`, usuario 27, ubicación, estado y evidencia.  
**Qué resaltar:** identificadores relacionados y estado.

**Descripción para el informe:** “La consulta SQL confirmó la persistencia del reporte y su relación con el usuario, la ubicación y la evidencia cargada.”

### CAPTURA 6 — Contacto de emergencia

**Dónde tomarla:** pantalla Apoyo junto con Network.  
**Qué debe aparecer:** `POST /api/contacts` 201, `GET /api/contacts` 200 y el contacto visualizado.  
**Qué ocultar:** parte central del teléfono si la captura se comparte públicamente.

**Descripción para el informe:** “El contacto fue enviado al backend, almacenado en MySQL y recuperado nuevamente para su visualización en la interfaz.”

### CAPTURA 7 — Consulta de ruta

**Dónde tomarla:** pantalla Inicio con el mapa y Network.  
**Qué debe aparecer:** `GET /api/routes/trazar?...`, 200 y ruta mostrada.  
**Qué resaltar:** URL, método, código y respuesta JSON.

**Descripción para el informe:** “SafeWalk U consumió el servicio de rutas mediante una solicitud GET con coordenadas de origen y destino, procesando la respuesta para representarla en el mapa.”

### CAPTURA 8 — SOS registrado

**Dónde tomarla:** imagen generada durante esta prueba o pantalla `/sos`.  
**Qué debe aparecer:** UIDE Campus Loja y el mensaje `ALERTA REGISTRADA`.  
**Endpoint:** `POST /api/reports/sos`.  
**Código definido:** 201.

**Descripción para el informe:** “El estudiante activó una alerta SOS desde la interfaz; el backend creó un reporte de tipo SOS_PANICO y la aplicación confirmó que quedó pendiente de atención.”

### CAPTURA 9 — SOS recibido por administración

**Dónde tomarla:** dashboard administrativo antes de atender la alerta.  
**Qué debe aparecer:** `SOS pendientes: 1`, estudiante, ubicación y botón `Marcar atendida`.  
**Endpoint de consulta:** `GET /api/reports` y `GET /api/dashboard/metricas`.  
**Código esperado:** 200.

**Descripción para el informe:** “La alerta creada en el frontend estudiantil fue recuperada por los servicios administrativos y presentada como pendiente para su gestión.”

### CAPTURA 10 — SOS atendido y persistido

**Dónde tomarla:** dashboard recargado y resultado de la consulta SQL indicada en la sección 9.  
**Qué debe aparecer:** `SOS pendientes: 0`, `VALIDADO: 2` y en MySQL el último SOS con estado `VALIDADO`.  
**Endpoint:** `PUT /api/reports/sos/:id/atender`.  
**Código definido:** 200.

**Descripción para el informe:** “El administrador atendió la alerta mediante una solicitud PUT. Tras recargar la aplicación, el dashboard mantuvo cero alertas pendientes, y MySQL reflejó el estado VALIDADO y el administrador responsable.”

## 13. Análisis de resultados

Los flujos evaluados demuestran integración real entre frontend, backend y MySQL. Las vistas no se consideraron funcionales únicamente por su apariencia: se contrastaron con solicitudes HTTP, respuestas JSON, cambios de estado, consultas SQL aportadas y recargas posteriores. Los controles JWT distinguieron correctamente autenticación y autorización por rol.

La prueba SOS demostró dos consumidores del mismo backend: la vista estudiantil creó la alerta y el dashboard administrativo la recuperó y actualizó. La persistencia se corroboró funcionalmente mediante recarga; para la entrega se recomienda añadir la captura SQL del último SOS usando la consulta suministrada.

## 14. Conclusiones

1. SafeWalk U integra el frontend React/Vite con una API REST de Express/TypeScript mediante HTTPS.
2. Los flujos principales probados procesan respuestas reales del backend y presentan sus resultados en la interfaz.
3. La autenticación JWT y las restricciones por rol funcionan en los escenarios comprobados.
4. El registro, perfil, reportes, contactos y alertas SOS utilizan persistencia MySQL.
5. Nginx y PM2 mantienen operativa la aplicación en el dominio productivo.

## 15. Recomendaciones

1. Ocultar siempre JWT, contraseñas, hashes y teléfonos completos en las evidencias.
2. Tomar la captura SQL del SOS antes de entregar para disponer de evidencia física de la última escritura.
3. Conservar una única fuente OpenAPI y actualizarla cada vez que cambien las rutas.
4. Mantener respaldos y monitorear el espacio de la instancia EC2.
5. Realizar una prueba adicional en un dispositivo móvil físico cuando el tiempo lo permita.

## 16. Repositorio

- Rama revisada: `main`.
- GitLab: `https://gitlab.com/Milena04-group/safewalku2.git`.
- GitHub: `https://github.com/MilenaO02/SafeWalkU.git`.
- Último commit local comprobado: `da363c37 Sincroniza contrato OpenAPI y seguridad`.
- GitLab `main` permanece en `82daf08f` hasta publicar el commit local.
- GitHub `main` se encuentra en una historia antigua y divergente (`39d23e2b`); no debe forzarse sin autorización expresa.
- `.env` y `node_modules` están ignorados y no se encuentran versionados.

Existen archivos locales de documentación, validación y builds que no deben añadirse de forma masiva. Antes de publicar, se debe seleccionar únicamente el código necesario.

## 17. Checklist de cumplimiento

| REQUISITO | ESTADO | EVIDENCIA |
|---|---|---|
| Documento técnico | CUMPLE | Este documento listo para adaptar al formato institucional |
| Integración frontend-backend | CUMPLE | Login, reportes, contactos, rutas y SOS probados |
| Consumo de endpoints | CUMPLE | Solicitudes GET, POST, PUT y DELETE comprobadas |
| Solicitudes HTTP/HTTPS | CUMPLE | Dominio HTTPS y rutas relativas `/api` |
| Respuestas de endpoints | CUMPLE | Respuestas JSON y códigos 200, 201, 401 y 403 observados/contrastados |
| Visualización/procesamiento | CUMPLE | Datos representados en formularios, listados, mapa y dashboard |
| Persistencia MySQL | CUMPLE | Evidencias SQL de usuario, foto, reporte y contacto; añadir captura SQL final del SOS |
| Repositorio actualizado | PENDIENTE | Commit local `da363c37`; falta publicar en GitLab y resolver de forma segura la divergencia de GitHub |
| Dominio funcional | CUMPLE | `https://safewalku.online` operativo durante las pruebas |

## 18. Limitaciones declaradas

- No se realizó en esta última prueba una conexión SQL directa automatizada desde el equipo local; la evidencia física del SOS debe capturarse desde MySQL con la consulta incluida.
- Las capturas de Network deben tomarse desde DevTools porque contienen los encabezados y payloads exactos de la sesión del navegador.
- No se declara una prueba reciente completa en Safari/Firefox o en un teléfono físico.
- Las correcciones OpenAPI y de cabeceras están validadas localmente, pero aún no están desplegadas porque no se realizó un push automático.
