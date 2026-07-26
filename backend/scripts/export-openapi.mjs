import { writeFile } from 'node:fs/promises';
import runtimeSpec from '../dist/docs/swagger.js';

const target = new URL('../openapi.yaml', import.meta.url);
await writeFile(target, `${JSON.stringify(runtimeSpec, null, 2)}\n`, 'utf8');
console.log(`Contrato OpenAPI generado con ${Object.keys(runtimeSpec.paths).length} rutas.`);
