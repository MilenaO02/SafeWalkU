import { readFile } from 'node:fs/promises';
import runtimeSpec from '../dist/docs/swagger.js';

const snapshot = JSON.parse(await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8'));

if (JSON.stringify(snapshot) !== JSON.stringify(runtimeSpec)) {
  console.error('openapi.yaml no coincide con el contrato publicado. Ejecute npm run openapi:generate.');
  process.exit(1);
}

const expectedOperations = [
  'GET /health',
  'POST /auth/register', 'POST /auth/login', 'POST /auth/switch-role',
  'GET /users', 'GET /users/me', 'PUT /users/me', 'GET /users/{id}', 'PUT /users/{id}', 'DELETE /users/{id}', 'PUT /users/{id}/foto',
  'GET /reports', 'POST /reports', 'GET /reports/zonas/riesgo', 'POST /reports/sos', 'PUT /reports/sos/{id}/cancelar', 'PUT /reports/sos/{id}/atender', 'GET /reports/{id}', 'PUT /reports/{id}', 'DELETE /reports/{id}',
  'GET /evidencias', 'POST /evidencias', 'GET /evidencias/{id}', 'PUT /evidencias/{id}', 'DELETE /evidencias/{id}',
  'GET /routes', 'POST /routes', 'GET /routes/trazar', 'GET /routes/{id}', 'PUT /routes/{id}', 'DELETE /routes/{id}',
  'GET /ubicaciones', 'GET /ubicaciones/buscar', 'PUT /ubicaciones/{id}/coordenadas',
  'GET /locations', 'GET /locations/buscar', 'PUT /locations/{id}/coordenadas',
  'GET /dashboard/metricas', 'GET /contacts', 'POST /contacts', 'PUT /contacts/{id}', 'DELETE /contacts/{id}',
  'GET /services', 'GET /places'
];

const documentedOperations = Object.entries(runtimeSpec.paths).flatMap(([path, pathItem]) =>
  Object.keys(pathItem).map((method) => `${method.toUpperCase()} ${path}`)
);

const missing = expectedOperations.filter((item) => !documentedOperations.includes(item));
const unexpected = documentedOperations.filter((item) => !expectedOperations.includes(item));

if (missing.length || unexpected.length) {
  if (missing.length) console.error(`Operaciones faltantes: ${missing.join(', ')}`);
  if (unexpected.length) console.error(`Operaciones inesperadas: ${unexpected.join(', ')}`);
  process.exit(1);
}

for (const [path, pathItem] of Object.entries(runtimeSpec.paths)) {
  for (const [method, endpoint] of Object.entries(pathItem)) {
    if (!endpoint.responses || !Object.keys(endpoint.responses).length) {
      console.error(`${method.toUpperCase()} ${path} no documenta respuestas.`);
      process.exit(1);
    }
    if (!Array.isArray(endpoint.security)) {
      console.error(`${method.toUpperCase()} ${path} no declara seguridad.`);
      process.exit(1);
    }
  }
}

console.log(`OpenAPI validado: ${Object.keys(runtimeSpec.paths).length} rutas y ${documentedOperations.length} operaciones sincronizadas.`);
