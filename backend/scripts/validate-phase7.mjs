import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const uiRoot = resolve(root, '..', 'frontend');
const read = (path) => readFile(resolve(root, path), 'utf8');
const readUi = (path) => readFile(resolve(uiRoot, path), 'utf8');
const [html, css, leafletCss, layout, login, report, sos, users, history, httpTest, reportService, swagger, localEnv, uiPackage, lightLogo, darkLogo, authContext, privateRoute, backendPackage, locationMigration] = await Promise.all([
  readUi('index.html'), readUi('src/index.css'), readUi('src/leaflet-safe.css'), readUi('src/layouts/MainLayout.jsx'), readUi('src/components/LoginEstudiante.jsx'),
  readUi('src/components/ReportarIncidente.jsx'), readUi('src/components/EmergenciaSos.jsx'), readUi('src/components/GestionUsuarios.jsx'),
  readUi('src/components/HistorialNotificaciones.jsx'), read('scripts/test-phase7-http.mjs'), read('src/services/report.service.ts'),
  read('src/docs/swagger.ts'), read('.env'), readUi('package.json'),
  stat(resolve(uiRoot, 'src/assets/icon_modoclaro.png')), stat(resolve(uiRoot, 'src/assets/icon_modooscuro.png')),
  readUi('src/context/AuthContext.jsx'), readUi('src/components/PrivateRoute.jsx'), read('package.json'),
  read('scripts/migrate-location-verification.mjs')
]);
const checks = [];
const expect = (source, pattern, message) => checks.push({ ok: pattern.test(source), message });

expect(html, /<html lang="es">/, 'El documento debe declarar idioma español.');
expect(html, /name="viewport"[\s\S]*name="description"[\s\S]*SafeWalk U/, 'Debe incluir metadatos responsive y descriptivos.');
expect(css, /:focus-visible[\s\S]*prefers-reduced-motion/, 'Debe ofrecer foco visible y respetar movimiento reducido.');
expect(css + leafletCss, /leaflet-safe[\s\S]*leaflet-container/, 'Leaflet debe usar estilos locales sin recursos sin resolver.');
expect(layout, /md:hidden[\s\S]*safe-area-inset-bottom/, 'La navegación móvil debe respetar el área segura.');
expect(layout, /min-h-11[\s\S]*h-11 w-11/, 'La navegación y la cabecera deben conservar blancos táctiles de 44 px.');
expect(leafletCss, /\.leaflet-bar a[\s\S]*width:\s*44px[\s\S]*height:\s*44px/, 'Los controles de zoom del mapa deben medir 44 por 44 px.');
expect(login, /aria|htmlFor="email"/, 'El acceso debe asociar etiquetas con campos.');
expect(report, /min-h-11[\s\S]*role="alert"/, 'El reporte debe ofrecer blancos táctiles y errores accesibles.');
expect(sos, /window\.confirm[\s\S]*role="alert"[\s\S]*tel:/, 'SOS debe confirmar, anunciar errores y ofrecer llamada real.');
expect(users, /aria-label="Buscar usuario"[\s\S]*disabled=/, 'Usuarios debe tener controles identificables y estados deshabilitados.');
expect(history, /aria-label="Buscar reporte"[\s\S]*role="alert"/, 'El historial debe tener búsqueda y errores accesibles.');
expect(httpTest, /status, 401[\s\S]*status, 403[\s\S]*reportes ajenos[\s\S]*status, 422/, 'La prueba HTTP debe cubrir autenticación, roles, propiedad y validación.');
expect(reportService, /findAccessibleById[\s\S]*reporte\.id_usuario !== user\.id_usuario/, 'El backend debe comprobar propiedad de reportes.');
expect(users + history, /request\('\/users'\)[\s\S]*request\('\/reports'\)/, 'Las vistas administrativas deben usar datos persistidos.');
const secret = localEnv.match(/^JWT_SECRET=(.+)$/m)?.[1] ?? '';
checks.push({ ok: secret.length >= 64 && !secret.startsWith('CAMBIAR_'), message: 'JWT_SECRET local debe ser aleatorio y contener al menos 64 caracteres.' });
expect(swagger, /"\/health"[\s\S]*"\/auth\/login"[\s\S]*"\/users\/me"[\s\S]*"\/reports\/sos"[\s\S]*"\/evidencias"[\s\S]*"\/routes\/trazar"[\s\S]*"\/contacts"[\s\S]*"\/places"/, 'OpenAPI debe cubrir todas las familias de endpoints.');
expect(uiPackage, /"browserslist"[\s\S]*Chrome[\s\S]*Firefox[\s\S]*Safari[\s\S]*iOS/, 'El frontend debe declarar navegadores compatibles.');
expect(authContext, /buildApiUrl\('\/users\/me'\)[\s\S]*sessionReady/, 'La sesión guardada debe validarse antes de habilitar rutas privadas.');
expect(privateRoute, /sessionReady[\s\S]*Validando sesión/, 'Las rutas privadas deben esperar la validación inicial del JWT.');
expect(backendPackage, /"migrate:locations"/, 'El backend debe exponer la migración de coordenadas existentes.');
expect(locationMigration, /verificada[\s\S]*fuente[\s\S]*ALTER TABLE coordenada/, 'La migración debe incorporar metadatos de verificación de coordenadas.');
checks.push({ ok: lightLogo.size < 100_000 && darkLogo.size < 100_000, message: 'Los logotipos deben pesar menos de 100 KB cada uno.' });

const failed = checks.filter((check) => !check.ok);
if (failed.length) { failed.forEach((item) => console.error(`- ${item.message}`)); process.exit(1); }
console.log(`Fase 7 validada: ${checks.length} controles de calidad, accesibilidad, permisos y responsive superados.`);
