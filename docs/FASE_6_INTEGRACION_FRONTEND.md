# Fase 6: integración del frontend

## Resultado

El frontend quedó conectado con la API en los flujos críticos del estudiante y del administrador. Se eliminaron datos simulados que podían presentar acciones o información inexistente y se reforzó el funcionamiento responsive desde celular.

## Integraciones realizadas

- La gestión administrativa de usuarios obtiene registros reales y permite su desactivación mediante la API.
- El historial administrativo muestra reportes y alertas SOS persistidos, con búsqueda y filtros.
- El formulario de incidentes carga ubicaciones registradas y refleja el punto seleccionado en el mapa.
- La pantalla SOS usa ubicaciones y contactos personales reales, registra la alerta y permite cancelarla.
- El perfil se obtiene desde `GET /api/users/me`, se actualiza y admite carga real de fotografía sin simular éxito cuando falla el servidor.
- El detalle de una zona de riesgo representa el reporte validado seleccionado desde el inicio.
- Las respuestas HTTP 401 eliminan la sesión local y notifican que es necesario volver a iniciar sesión.
- La consulta de reportes limita a los estudiantes a sus propios registros; los administradores conservan la vista general.
- El panel administrativo incluye navegación inferior en celular y contenido adaptable, sin depender de una barra lateral fija.
- Se incorporaron estados de carga, error, vacío, reintento y acción en curso en las vistas conectadas.

## Validación

Desde `backend`:

```bash
npm run test
npm run build
```

Desde `frontend`:

```bash
npm run lint
npm run build
```

`backend/scripts/validate-phase6.mjs` comprueba automáticamente la integración de sesión, permisos, perfil, usuarios, reportes, SOS y navegación responsive.

## Alcance pendiente para la fase 7

- Pruebas manuales en dispositivos o emuladores con anchos de 320, 360, 390 y 768 px.
- Pruebas con conexión lenta, pérdida de red y permisos de ubicación rechazados.
- Revisión visual de contraste, foco de teclado y lectores de pantalla.
- Optimización del paquete JavaScript y de las imágenes de marca.
