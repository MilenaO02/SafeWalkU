import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const openApiFile = fileURLToPath(new URL('../../../openapi.json', import.meta.url));

export function getOpenApiResource(): string {
  try {
    // Ruta basada en este modulo, no en process.cwd(): Claude Desktop puede
    // iniciar el proceso desde cualquier directorio de Windows.
    return readFileSync(openApiFile, 'utf8');
  } catch (error) {
    console.error('[OPENAPI RESOURCE ERROR] No se pudo leer el contrato OpenAPI.', error instanceof Error ? error.message : error);
    return JSON.stringify({ error: 'El contrato OpenAPI no esta disponible localmente.' });
  }
}

export function getCapabilitiesCatalogResource(): string {
  return JSON.stringify({
    resource: 'safewalk://catalogo-capacidades',
    transport: 'stdio',
    readTools: ['safewalk_listar_ubicaciones', 'safewalk_consultar_ubicacion', 'safewalk_listar_rutas', 'safewalk_consultar_ruta', 'safewalk_listar_reportes', 'safewalk_consultar_reporte', 'safewalk_listar_servicios_emergencia', 'safewalk_listar_lugares_seguros'],
    writeTools: ['safewalk_crear_reporte', 'safewalk_crear_contacto_emergencia', 'safewalk_actualizar_estado_reporte'],
    restrictions: [
      'Todas las escrituras requieren confirmacion_explicita: true.',
      'safewalk_actualizar_estado_reporte requiere un JWT de ADMINISTRADOR.',
      'El MCP consume exclusivamente la API HTTPS: no abre MySQL ni ejecuta SQL.',
      'Las respuestas de reportes minimizan datos personales.'
    ]
  }, null, 2);
}
