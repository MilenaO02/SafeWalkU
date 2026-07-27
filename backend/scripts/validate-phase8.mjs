import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const read = (path) => readFile(resolve(projectRoot, path), 'utf8');

const [rootReadme, deployDoc, userManual, compose, nginx, pm2, backendDeploy, frontendDeploy, backup, rootEnv, backendEnv, openapi] = await Promise.all([
  read('README.md'), read('docs/DESPLIEGUE.md'), read('docs/MANUAL_USUARIO.md'), read('docker-compose.yml'),
  read('frontend/nginx.conf'), read('backend/ecosystem.config.cjs'), read('deploy-backend.sh'),
  read('deploy-frontend.sh'), read('backup-database.sh'), read('.env.example'), read('backend/.env.example'),
  read('backend/openapi.yaml')
]);

const checks = [];
const expect = (source, pattern, message) => checks.push({ ok: pattern.test(source), message });

expect(rootReadme, /Inicio rapido con Docker[\s\S]*docker compose up[\s\S]*Verificacion/, 'README principal incompleto.');
expect(deployDoc, /Docker Compose[\s\S]*PM2 y Nginx[\s\S]*Respaldo y restauracion[\s\S]*rollback/i, 'La guia de despliegue debe cubrir operacion y recuperacion.');
expect(userManual, /Estudiante[\s\S]*Administrador[\s\S]*geolocalizacion/i, 'El manual debe cubrir ambos roles y permisos de ubicacion.');
expect(compose, /MYSQL_ROOT_PASSWORD:\s*\$\{MYSQL_ROOT_PASSWORD:\?[^}]+\}[\s\S]*JWT_SECRET:\s*\$\{JWT_SECRET:\?[^}]+\}/, 'Compose no debe incluir secretos productivos predeterminados.');
expect(compose, /backend:[\s\S]*condition: service_healthy[\s\S]*APP_PORT:-8080/, 'Compose debe esperar servicios saludables y publicar un puerto configurable.');
expect(nginx, /proxy_pass http:\/\/backend:3000\/api\/[\s\S]*location \^~ \/uploads\/[\s\S]*location = \/healthz/, 'Nginx del contenedor debe usar DNS interno, priorizar cargas y exponer health check.');
expect(pm2, /\/var\/www\/safewalku\/backend[\s\S]*autorestart: true/, 'PM2 debe usar la ruta de despliegue documentada.');
expect(backendDeploy, /npm ci[\s\S]*npm run build[\s\S]*pm2 reload[\s\S]*curl --fail/, 'El despliegue backend debe compilar, recargar y comprobar salud.');
expect(frontendDeploy, /npm run lint[\s\S]*npm run build[\s\S]*rsync -a --delete[\s\S]*nginx -t/, 'El despliegue frontend debe validar, sincronizar y comprobar Nginx.');
expect(backup, /single-transaction[\s\S]*routines[\s\S]*triggers[\s\S]*gzip/, 'El respaldo debe ser consistente e incluir objetos de base.');
expect(rootEnv + backendEnv, /JWT_SECRET=.*64_CARACTERES[\s\S]*CORS_ORIGIN=/, 'Los ejemplos deben documentar seguridad y origenes.');
expect(openapi, /^openapi: 3\.0\.3/m, 'El contrato debe declarar OpenAPI 3.0.3.');

const failed = checks.filter(({ ok }) => !ok);
if (failed.length) {
  failed.forEach(({ message }) => console.error(`- ${message}`));
  process.exit(1);
}
console.log(`Fase 8 validada: ${checks.length} controles de documentacion y despliegue superados.`);
