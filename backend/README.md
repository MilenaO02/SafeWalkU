# SafeWalk API

API REST de SafeWalk U desarrollada con Express, TypeScript y MySQL 8. Sigue capas Controller-Service-Repository e incorpora JWT, autorizacion por rol y propiedad, Zod, bcrypt, rate limiting, carga controlada de evidencias y manejo centralizado de errores.

## Instalacion local

```bash
cp .env.example .env
# Completar DB_PASSWORD y generar JWT_SECRET (64+ caracteres recomendado)
npm ci
npm run dev
```

La base `safewalku` se crea con `db/schema.sql`. `db/seed.sql` es opcional y solo para demostracion. La API escucha por defecto en `http://localhost:3000`, el health check es `GET /api/health` y Swagger se publica en `/api-docs`.

## Comandos

```bash
npm run typecheck
npm run build
npm test
npm run openapi:generate
npm run validate:openapi
```

El contrato fuente se mantiene en `src/docs/swagger.ts`, se publica en `/api-docs` y `npm run openapi:generate` actualiza la instantanea `openapi.yaml`. `npm run validate:openapi` comprueba que ambas representaciones coincidan y que todas las operaciones registradas esten documentadas.

## Variables

`PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT`, `DB_CONNECT_TIMEOUT_MS`, `JWT_SECRET`, `JWT_EXPIRES` y `CORS_ORIGIN` estan documentadas en `.env.example`. `CORS_ORIGIN` acepta una lista separada por comas. Nunca registre el archivo `.env`.
