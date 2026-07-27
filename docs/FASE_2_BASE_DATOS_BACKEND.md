# Fase 2: base de datos y backend base

## 1. Resultado

La implementación técnica de la fase 2 quedó completada. El esquema, los datos iniciales, la configuración del pool, el arranque del servidor y la arquitectura por capas fueron auditados y corregidos. El repositorio incluye una validación automatizada que se ejecuta con `npm test` y una verificación SQL para ejecutar contra MySQL.

La base MySQL quedó disponible y fue verificada posteriormente mediante `verify.sql` y las pruebas de integración automatizadas de reportes, evidencias, SOS, permisos y perfiles.

## 2. Cambios realizados

### Integridad del esquema

- Se añadieron restricciones para radio, latitud, longitud, tiempo estimado y orden de los puntos.
- Se impidieron órdenes duplicados dentro de una ruta.
- Se impidieron rutas favoritas duplicadas por usuario.
- Se aseguró mediante clave foránea compuesta que una ubicación solo pueda compartirse con un contacto perteneciente al mismo usuario.
- Se vinculó el estado de una sesión compartida con la presencia o ausencia de su fecha de finalización.

### Datos iniciales

- Se corrigieron los destinos de las rutas para que coincidan con sus nombres.
- Se corrigió la propiedad de los primeros contactos para mantener coherencia con las sesiones de ubicación compartida.
- Se mantuvieron 22 usuarios, ubicaciones, rutas, reportes, evidencias y registros de ejemplo de los módulos principales. El usuario Alejandro Morocho permanece como estudiante y no posee registro en `administrador`.

### Configuración y arranque

- Se validan los intervalos de `PORT`, `DB_PORT`, `DB_CONNECTION_LIMIT` y `DB_CONNECT_TIMEOUT_MS`.
- El pool usa keep-alive y permite configurar límite de conexiones y timeout.
- Se eliminó la contraseña `root` como valor predeterminado implícito.
- `.env.example` contiene todas las variables utilizadas y valores orientados al desarrollo local.
- La API ya no comienza a escuchar tráfico antes de comprobar la conexión con MySQL.
- Si MySQL no está disponible, el proceso informa el problema y termina con código de error.

### Arquitectura de tres capas

- Contactos, lugares seguros y servicios de emergencia ahora pasan por una capa de servicios.
- Las consultas de métricas se movieron a `dashboard.repository.ts`.
- Los controladores no acceden directamente a repositorios ni a MySQL.
- Los servicios no acceden directamente al pool de conexiones.

```text
Routes -> Middleware -> Controllers -> Services -> Repositories -> MySQL
```

## 3. Archivos principales

| Archivo | Finalidad |
|---|---|
| `backend/db/schema.sql` | Creación del modelo y restricciones de integridad |
| `backend/db/seed.sql` | Datos iniciales coherentes |
| `backend/db/verify.sql` | Consultas de integridad posteriores a la carga |
| `backend/scripts/validate-phase2.mjs` | Validación estática reproducible de esquema, seed, entorno y capas |
| `backend/scripts/migrate-location-verification.mjs` | Migración idempotente para instalaciones existentes de coordenadas |
| `backend/src/config/database.ts` | Configuración validada del pool MySQL |
| `backend/src/server.ts` | Arranque condicionado a la disponibilidad de MySQL |
| `backend/.env.example` | Contrato de variables de entorno |

## 4. Verificaciones ejecutadas

Desde `backend/`:

```powershell
npm test
npm run build
docker compose -f ../docker-compose.yml config --quiet
```

Resultados:

- TypeScript `typecheck`: correcto.
- Validación automatizada de fase 2: correcta.
- Compilación del backend: correcta.
- Sintaxis de Docker Compose: correcta; Docker informa que la propiedad `version` es obsoleta, pero no bloquea la configuración.
- Revisión de formato de los archivos modificados: correcta.

## 5. Prueba ejecutada con MySQL

Con Docker Desktop iniciado, ejecutar desde la raíz:

```powershell
docker compose down -v
docker compose up -d mysql
Get-Content .\backend\db\verify.sql | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" safewalku'
```

Al crear un volumen nuevo, MySQL ejecuta automáticamente `schema.sql` y `seed.sql` mediante los archivos montados en `docker-entrypoint-initdb.d`. Todas las filas de la primera consulta de `verify.sql` deben devolver `0` en la columna `inconsistencias`.

> `docker compose down -v` elimina los datos del volumen de desarrollo. Solo debe utilizarse cuando sea seguro recrear esa base de datos desde cero.

## 6. Criterios de salida

- [x] Esquema y relaciones auditados.
- [x] Restricciones de integridad reforzadas.
- [x] Datos iniciales corregidos.
- [x] Variables de entorno documentadas.
- [x] Pool de conexiones configurado y validado.
- [x] Servidor condicionado a la conexión con MySQL.
- [x] Arquitectura Controller-Service-Repository normalizada.
- [x] Typecheck, validación de fase y build correctos.
- [x] Esquema, seed y `verify.sql` comprobados contra MySQL; la única excepción deliberada es el estudiante conservado sin fila de administrador.

## 7. Cierre posterior

La verificación contra MySQL se completó y las inconsistencias corregibles quedaron en cero. El usuario solicitado se conserva con rol `ESTUDIANTE`, por lo que no debe insertarse en `administrador`.
