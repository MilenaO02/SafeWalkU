# Fase 7: pruebas y calidad

## Estado

La fase 7 está completada para el alcance verificable en el repositorio y en Chrome. Se aprobaron las pruebas automáticas, la integración con MySQL, la autorización por roles y una matriz responsive de 320 a 1440 px. Las pruebas finales en dispositivos físicos Android/iOS y otros motores de navegador se conservan como aceptación previa a producción, no como bloqueo para comenzar la fase 8.

## Resultados ejecutados

| Área | Prueba | Resultado |
|---|---|---|
| Backend | TypeScript `typecheck` y compilación | Aprobada |
| Backend | Validadores de fases 2 a 7 | Aprobada |
| API y MySQL | Integración de reportes, evidencias y SOS | Aprobada |
| API y MySQL | Prueba HTTP de autenticación, roles y propiedad | Aprobada |
| Seguridad | Sin token: 401; estudiante en ruta administrativa: 403 | Aprobada |
| Seguridad | Sesión persistida validada con `/users/me` antes de montar rutas privadas | Aprobada |
| Validación | Coordenadas fuera de rango y correo no institucional: 422 | Aprobada |
| Frontend | `oxlint` y compilación Vite sin advertencias | Aprobada |
| Responsive | Acceso, registro, estudiante y administración en seis anchos | Aprobada en Chrome |
| Accesibilidad táctil | Acciones principales y zoom del mapa con mínimo de 44 × 44 px | Aprobada |
| Base local | Migración de verificación de coordenadas y `/api/ubicaciones` | Aprobada: HTTP 200, 22 registros |

Las cuentas QA utilizadas para recorrer los roles se crean de forma temporal y se eliminan al terminar. No se activó SOS ni se ejecutaron eliminaciones desde la interfaz.

## Matriz responsive ejecutada

Se comprobó ausencia de desplazamiento horizontal, elementos fuera del viewport, alertas de carga y blancos táctiles menores de 44 px en controles principales.

| Ancho | Uso representativo | Estado |
|---:|---|---|
| 320 px | Celular pequeño | Aprobado |
| 360 px | Android compacto | Aprobado |
| 390 px | iPhone moderno | Aprobado |
| 768 px | Tableta / horizontal | Aprobado |
| 1024 px | Portátil / tableta horizontal | Aprobado |
| 1440 px | Escritorio | Aprobado |

Vistas verificadas:

- Públicas: `/login` y `/registro`.
- Estudiante: `/app`, `/reportar`, `/sos`, `/contactos` y `/perfil`.
- Administrador: `/admin`, `/admin/usuarios`, `/admin/notificaciones`, `/admin/rutas`, `/admin/ubicaciones` y `/admin/configuracion`.

## Correcciones aplicadas durante la prueba visual

- En móvil, el enlace de recuperación dejó de superponerse a la etiqueta de contraseña.
- Una sesión almacenada se valida antes de montar rutas privadas; un JWT vencido redirige una sola vez al acceso y no dispara múltiples peticiones 401.
- Las rutas React se cargan de forma diferida; el paquete principal quedó por debajo del umbral de advertencia de Vite.
- Se añadieron nombres accesibles y blancos táctiles de 44 px a acciones de cabecera y navegación.
- Los controles de zoom de Leaflet ahora miden 44 × 44 px.
- Se añadió y aplicó `npm run migrate:locations` para instalaciones existentes que no tenían `coordenada.verificada` y `coordenada.fuente`.
- La advertencia observada en `feature_collector.js` pertenece a una extensión de Chrome y no se origina en SafeWalk U.

## Comandos reproducibles

Desde `backend`:

```bash
npm run migrate:locations
npm test
npm run test:http:phase7
npm run test:integration:phase4
npm run validate:openapi
npm run audit:offline
```

Desde `frontend`:

```bash
npm run lint
npm run build
npm run audit:offline
```

## Aceptación adicional previa a producción

Conviene repetir la matriz en Chrome/Firefox de Android y Safari de iOS físicos, incluyendo zoom de texto del sistema, teclado virtual, permiso GPS rechazado y red móvil intermitente. La aplicación ya ofrece ingreso manual de coordenadas, aviso de desconexión y reintento; esta validación depende del dispositivo y de la red objetivo.
