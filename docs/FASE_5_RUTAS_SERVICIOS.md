# Fase 5: rutas y servicios de seguridad

## Resultado

La fase 5 quedó implementada e integrada entre backend y frontend. El sistema trabaja con ubicaciones y coordenadas persistidas, protege los recursos personales y solicita la geolocalización de forma explícita, con una alternativa manual compatible con celulares.

## Cambios realizados

- El CRUD de rutas guarda y actualiza sus puntos en `ruta_ubicacion` dentro de transacciones.
- El trazado valida latitud, longitud y destino; calcula distancia con Haversine y estima el tiempo a pie.
- Cuando existe una ruta catalogada hacia el destino, devuelve sus puntos ordenados; en caso contrario informa que usa una referencia directa.
- Las búsquedas de ubicaciones devuelven coordenadas reales.
- Contactos personales: máximo de cinco por estudiante, validación Zod y actualización/eliminación limitada al propietario.
- Lugares seguros, servicios de emergencia, ubicaciones y contactos requieren una sesión autenticada.
- La vista de apoyo consume `/contacts`, `/services` y `/places`, muestra sus puntos en el mapa y utiliza enlaces `tel:` en celular.
- El mapa no activa GPS al abrirse. Primero explica el uso, solicita consentimiento y permite ingresar latitud/longitud si el permiso se rechaza o el dispositivo no dispone de GPS.
- Los controles principales tienen una altura táctil mínima de 44 px.

## Verificación reproducible

Desde `backend`:

```bash
npm run migrate:locations
npm run test
npm run build
```

Desde `frontend`:

```bash
npm run lint
npm run build
```

La validación específica está en `backend/scripts/validate-phase5.mjs` y se ejecuta como parte de `npm test`.

## Criterios de aceptación cumplidos

- No se usan coordenadas ficticias cuando el usuario no comparte su ubicación.
- El permiso de GPS se solicita únicamente después de una acción consciente.
- Existe continuidad manual para navegadores móviles sin permiso o sin geolocalización.
- Las rutas conservan el orden de sus puntos y la distancia se calcula a partir de coordenadas.
- Un usuario no puede modificar ni eliminar contactos ajenos.
- Los datos de apoyo visibles en la interfaz proceden de la API autenticada.
- Las instalaciones existentes incorporan de forma idempotente `coordenada.verificada` y `coordenada.fuente` mediante `npm run migrate:locations`.

## Alcance y limitación

Esta versión es una web responsive: el seguimiento GPS funciona mientras la página permanece abierta. El seguimiento en segundo plano y el despacho automático de alertas a autoridades o familiares no forman parte de esta fase.
