# SafeWalk U

Aplicacion web responsive de seguridad universitaria. Permite a estudiantes consultar rutas y lugares seguros, reportar incidentes con evidencias, gestionar contactos y activar SOS; el rol administrador dispone de indicadores y gestion de usuarios y reportes.

## Requisitos

- Node.js 20 y npm 10 para ejecucion local.
- MySQL 8.
- Docker Engine con Compose v2 para el despliegue reproducible.

## Inicio rapido con Docker

```bash
cp .env.example .env
# Reemplazar todas las variables CAMBIAR_* en .env
docker compose config
docker compose up --build -d
docker compose ps
curl http://localhost:8080/api/health
```

La aplicacion queda en `http://localhost:8080` y Swagger en `http://localhost:8080/api-docs`. El contrato fuente esta en `backend/openapi.yaml`. Los datos de MySQL y los archivos subidos usan volumenes persistentes.

Para calcular rutas reales a pie, cree una clave en OpenRouteService y configure `OPENROUTESERVICE_API_KEY` en `.env`. La clave solo llega al backend. Sin ella, SafeWalk U utiliza el trazado manual guardado por el administrador o una referencia directa y lo identifica claramente en pantalla.

En produccion, el dominio entra por Nginx y este reenvia a Docker en `127.0.0.1:8080`; no se publican directamente MySQL ni el backend. Ejecute `./deploy-production.sh` en el servidor. Las coordenadas se corrigen sin editar SQL desde **Administracion > Ubicaciones**, haciendo clic en el punto real y guardando.

> `backend/db/seed.sql` contiene cuentas academicas de demostracion. No debe cargarse en un entorno con datos reales.

## Ejecucion local

1. Crear la base `safewalku` y ejecutar `backend/db/schema.sql`; opcionalmente, cargar `backend/db/seed.sql`.
2. Copiar `backend/.env.example` a `backend/.env` y completar las credenciales.
3. Copiar `frontend/.env.example` a `frontend/.env` y usar `VITE_API_URL=http://localhost:3000/api`.
4. Si la base ya existía antes de incorporar la verificación de coordenadas, ejecutar una vez `cd backend && npm run migrate:locations`.
5. En terminales separadas ejecutar:

```bash
cd backend && npm ci && npm run dev
cd frontend && npm ci && npm run dev
```

## Verificacion

```bash
cd backend
npm test
npm run validate:openapi
npm run test:http:phase7
npm run test:integration:phase4

cd ../frontend
npm run lint
npm run build
```

Las pruebas HTTP e integracion que requieren MySQL se describen en `docs/FASE_7_PRUEBAS_CALIDAD.md`.

## Documentacion

- `docs/MANUAL_USUARIO.md`: guia para estudiante y administrador.
- `docs/DESPLIEGUE.md`: Docker, PM2/Nginx, TLS, respaldo y restauracion.
- `docs/FASE_8_DOCUMENTACION_DESPLIEGUE.md`: alcance y evidencia de la fase 8.
- `PLANIFICACION.md`: plan y seguimiento completo.

## Seguridad

Nunca se deben versionar `.env`, respaldos ni archivos subidos. En produccion use contrasenas independientes y un `JWT_SECRET` aleatorio de al menos 64 caracteres, limite el puerto MySQL al host y termine TLS en un proxy Nginx/Certbot siguiendo la guia de despliegue.
