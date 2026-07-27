# Guia de despliegue y operacion

## Opcion recomendada: Docker Compose

1. Instale Docker Engine y Compose v2.
2. Copie `.env.example` como `.env`; cambie ambos passwords y genere `JWT_SECRET` con al menos 64 caracteres aleatorios.
3. Ejecute `docker compose config` y confirme que no aparezca `CAMBIAR_`.
4. Inicie con `docker compose up --build -d`.
5. Valide `docker compose ps` y `curl --fail http://localhost:8080/api/health`.

El Nginx interno atiende HTTP y resuelve `backend` por la red de Compose. En Internet, termine HTTPS en un proxy externo o balanceador y reenvie al puerto `APP_PORT`. No exponga MySQL fuera del host.

Actualizacion segura:

```bash
./backup-database.sh
docker compose build
docker compose up -d
curl --fail http://localhost:8080/api/health
```

Los scripts SQL de inicializacion solo se ejecutan al crear por primera vez el volumen MySQL. Para cambios posteriores use, en orden, los archivos de `backend/db/migrations/` y respalde antes.

La imagen backend aplica al iniciar la migracion idempotente de geometria de rutas. En una instalacion manual puede ejecutarse expresamente con `cd backend && npm run migrate:routes`.

## Editor de rutas seguras

Un administrador accede a `/admin/rutas`. Para crear una ruta:

1. Complete nombre, descripcion, seguridad y tiempo estimado.
2. Seleccione ubicaciones distintas como origen y destino.
3. Pulse **Iniciar en el origen**.
4. Haga clic sobre el mapa siguiendo aceras, curvas y cruces en orden.
5. Pulse **Finalizar en el destino** y revise distancia y cantidad de puntos.
6. Use **Deshacer** o **Limpiar** si necesita corregir y finalmente **Guardar ruta**.

Los puntos se almacenan ordenados en `ruta_punto`. Una ruta antigua sin al menos dos puntos manuales se muestra como `REFERENCIAL`; no debe presentarse como verificada hasta dibujarla y comprobarla en campo.

## Opcion VPS: PM2 y Nginx

Use `/var/www/safewalku` como ruta de proyecto. Cree `backend/.env`, instale Node 20, PM2, Nginx, rsync y MySQL; ejecute `./deploy-backend.sh` y `./deploy-frontend.sh`. Instale `safewalku.nginx` en `sites-available`, ajuste dominio/rutas si corresponde y obtenga los certificados con Certbot antes de habilitar HTTPS.

El script backend compila, reduce dependencias, recarga PM2 y exige que el health check responda. El script frontend ejecuta lint/build, sincroniza `dist` y solo recarga Nginx tras `nginx -t`.

### Primera instalacion del dominio y certificado

Antes de ejecutar Certbot, el registro `A` del dominio debe apuntar a la IP publica del VPS y los puertos TCP 80 y 443 deben estar permitidos tanto en el firewall del proveedor (por ejemplo, Security Group) como en el firewall del sistema.

No instale directamente `safewalku.nginx` si los archivos de Let's Encrypt aun no existen: `nginx -t` fallara. Use primero la configuracion temporal incluida:

```bash
sudo cp safewalku-http-bootstrap.nginx /etc/nginx/sites-available/safewalku
sudo ln -sfn /etc/nginx/sites-available/safewalku /etc/nginx/sites-enabled/safewalku
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

sudo certbot certonly --webroot \
  -w /var/www/safewalku/dist \
  -d safewalku.online \
  -d www.safewalku.online

sudo cp safewalku.nginx /etc/nginx/sites-available/safewalku
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
```

Compruebe desde una red externa:

```bash
curl -I http://safewalku.online
curl -I https://safewalku.online
curl https://safewalku.online/api/health
```

Si aparece `403 Forbidden`, compruebe que `/var/www/safewalku/dist/index.html` exista, retire el sitio `default` de Nginx y aplique permisos de lectura:

```bash
sudo test -f /var/www/safewalku/dist/index.html
sudo chown -R www-data:www-data /var/www/safewalku
sudo find /var/www/safewalku -type d -exec chmod 755 {} \;
sudo find /var/www/safewalku -type f -exec chmod 644 {} \;
sudo nginx -T | grep -E 'server_name|root|ssl_certificate'
```

Revise tambien `sudo tail -n 100 /var/log/nginx/safewalku_error.log`. Un timeout, a diferencia de un 403, indica que el trafico ni siquiera llega a Nginx: normalmente el VPS esta apagado, la IP DNS es incorrecta o los puertos 80/443 estan cerrados.

## Respaldo y restauracion

`backup-database.sh` guarda por defecto en `backups/mysql` (ignorado por Git). Puede definir `BACKUP_DIR`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

```bash
DB_USER=safewalk_user DB_PASSWORD='...' ./backup-database.sh
gunzip -c backups/mysql/safewalku_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u safewalk_user -p safewalku
```

Pruebe restauraciones periodicamente en una base aislada. Los archivos de `backend/uploads` se respaldan por separado; un dump SQL no los incluye.

## Diagnostico y rollback

- API: `/api/health`; documentacion: `/api-docs`.
- Docker: `docker compose ps` y `docker compose logs --tail=200 backend`.
- PM2: `pm2 status` y `pm2 logs safewalk-backend`.
- Nginx: `sudo nginx -t` y sus logs en `/var/log/nginx/`.

Si una version falla, restaure el artefacto/codigo anterior, ejecute nuevamente los scripts de despliegue y restaure la base solo si una migracion incompatible fue aplicada. No use `schema.sql` sobre una base productiva: contiene recreacion de tablas.
