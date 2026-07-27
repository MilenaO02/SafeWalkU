# Auditoría previa a la fase 8

## Resultado general

Las fases 1 a 7 fueron revisadas antes de iniciar documentación y despliegue. Los builds, pruebas reproducibles, recorridos por rol y matriz responsive están aprobados. No quedan datos simulados en las rutas activas ni bloqueos técnicos conocidos para comenzar la fase 8.

## Correcciones cerradas

- MySQL confirmado mediante health check y pruebas reversibles.
- Migración idempotente `migrate:locations` añadida y aplicada; `/api/ubicaciones` responde 200.
- `JWT_SECRET` local reemplazado por 96 caracteres criptográficamente aleatorios y excluido de Git.
- La aplicación valida el JWT guardado con `/users/me` antes de montar páginas privadas y unifica la notificación de 401.
- OpenAPI 3.0.3 actualizado con 26 rutas y autenticación Bearer.
- Dashboard y configuración administrativa muestran únicamente datos persistidos o verificables.
- Componentes antiguos con contenido simulado eliminados.
- Errores funcionales visibles en la interfaz y aviso global de desconexión.
- Estilos Leaflet locales sin referencias rotas y controles de zoom de 44 × 44 px.
- Logos reducidos a 512 × 512 y carga de páginas dividida por ruta.
- Navegadores objetivo declarados: Chrome y Firefox recientes, Safari 15+ e iOS 15+.
- Lint y build del frontend sin advertencias.
- Auditoría npm local: cero vulnerabilidades conocidas en la caché disponible.
- Acceso, registro y todas las vistas activas de estudiante/administrador revisadas de 320 a 1440 px.

## Evidencia responsive

En Chrome se verificaron 320, 360, 390, 768, 1024 y 1440 px. Todas las vistas terminaron de cargar sin desbordamiento horizontal ni controles principales inferiores a 44 px. La alternativa manual de coordenadas permanece visible sin solicitar GPS automáticamente.

La advertencia amarilla de `feature_collector.js` vista en DevTools proviene de una extensión instalada en Chrome. No pertenece al código ni a los artefactos de SafeWalk U.

## Comprobaciones aprobadas

```bash
# backend
npm run migrate:locations
npm test
npm run test:http:phase7
npm run test:integration:phase4
npm run validate:openapi
npm run audit:offline

# frontend
npm run lint
npm run build
npm run audit:offline
```

## Riesgos no bloqueantes

- Repetir la aceptación en dispositivos físicos Android/iOS y Safari/Firefox antes de producción.
- Probar con el zoom de texto, teclado virtual y calidad real de la red móvil del entorno institucional.
- La geolocalización web solo funciona mientras la página está abierta; no existe seguimiento en segundo plano.
- La auditoría `npm audit --offline` depende de los avisos disponibles en caché. La auditoría en línea debe ejecutarse en un entorno autorizado a compartir metadatos de dependencias con npm.
