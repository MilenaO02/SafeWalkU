import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const frontend = resolve(root, '..', 'frontend', 'src');
const read = (path) => readFile(resolve(root, path), 'utf8');
const readFrontend = (path) => readFile(resolve(frontend, path), 'utf8');
const checks = [];
const expectText = (source, pattern, message) => checks.push({ ok: pattern.test(source), message });

const [schema, repository, service, contactRoutes, placeRoutes, serviceRoutes, map, student, support, routeEditor, migration] = await Promise.all([
  read('src/schemas/route.schema.ts'), read('src/repositories/route.repository.ts'), read('src/services/route.service.ts'),
  read('src/routes/contacto.routes.ts'), read('src/routes/lugar.routes.ts'), read('src/routes/servicio.routes.ts'),
  readFrontend('components/MapaInteractivo.jsx'), readFrontend('pages/StudentApp.jsx'), readFrontend('components/ListaContactosApoyo.jsx'),
  readFrontend('components/EditorRutas.jsx'), read('db/migrations/005_add_route_geometry.sql')
]);

expectText(schema, /\.min\(2/, 'Las rutas deben contener al menos dos ubicaciones.');
expectText(schema, /origen_lat[\s\S]*origen_lng[\s\S]*destino_id/, 'El trazado valida origen y destino.');
expectText(repository, /beginTransaction\(\)[\s\S]*commit\(\)[\s\S]*rollback\(\)/, 'La escritura de rutas debe ser transaccional.');
expectText(repository, /ORDER BY ru\.orden_punto/, 'Los puntos de ruta deben conservar el orden.');
expectText(repository, /INSERT INTO ruta_punto[\s\S]*DELETE FROM ruta_punto/, 'La geometrÃ­a manual debe guardarse y reemplazarse transaccionalmente.');
expectText(service, /earthRadius\s*=\s*6371000[\s\S]*Math\.asin/, 'La distancia debe calcularse geográficamente.');
expectText(contactRoutes, /router\.get\("\/", auth/, 'Los contactos deben requerir autenticación.');
expectText(contactRoutes, /validate\((create|update)ContactSchema\)/, 'Los contactos deben validarse con esquema.');
expectText(placeRoutes, /router\.get\("\/", auth/, 'Los lugares seguros deben estar protegidos.');
expectText(serviceRoutes, /router\.get\("\/", auth/, 'Los servicios deben estar protegidos.');
expectText(map, /useState\('prompt'\)/, 'El mapa debe pedir consentimiento antes de iniciar GPS.');
expectText(map, /Usar coordenadas/, 'El mapa debe ofrecer ubicación manual.');
expectText(student, /\/routes\/trazar/, 'El frontend debe consumir el endpoint real de trazado.');
expectText(routeEditor, /useMapEvents[\s\S]*Deshacer[\s\S]*Guardar ruta/, 'El administrador debe poder dibujar, corregir y guardar rutas.');
expectText(migration, /CREATE TABLE IF NOT EXISTS ruta_punto[\s\S]*latitud[\s\S]*longitud/, 'La migraciÃ³n debe crear la geometrÃ­a ordenada.');
expectText(support, /request\('\/contacts'\)[\s\S]*request\('\/services'\)[\s\S]*request\('\/places'\)/, 'La red de apoyo debe provenir de la API.');

const failures = checks.filter((check) => !check.ok);
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure.message}`));
  process.exit(1);
}
console.log(`Fase 5 validada: ${checks.length} controles de rutas, permisos, geolocalización y red de apoyo superados.`);
