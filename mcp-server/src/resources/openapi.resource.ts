import fs from 'fs';
import path from 'path';

export function getOpenApiResource(): string {
  try {
    // Intentar leer openapi.json desde raíz o directorio actual
    const rootPath = path.resolve(process.cwd(), '../openapi.json');
    const localPath = path.resolve(process.cwd(), 'openapi.json');
    
    let filePath = '';
    if (fs.existsSync(rootPath)) {
      filePath = rootPath;
    } else if (fs.existsSync(localPath)) {
      filePath = localPath;
    }

    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    }
  } catch (err) {
    console.error('[OPENAPI RESOURCE ERROR]', err);
  }

  // Fallback estructurado si no encuentra el archivo estático
  return JSON.stringify({
    openapi: '3.0.3',
    info: { title: 'SafeWalk U API', version: '1.0.0' },
    servers: [{ url: 'https://safewalku.online/api' }],
    security: [{ bearerAuth: [] }]
  }, null, 2);
}

export function getCapabilitiesCatalogResource(): string {
  const catalog = {
    resource: 'safewalk://catalogo-capacidades',
    version: '1.0.0',
    descripcion: 'Catálogo oficial de capacidades, herramientas y recursos expuestos por el servidor MCP SafeWalk U para asistentes de IA como Claude Desktop.',
    transport: 'stdio (JSON-RPC 2.0 vía stdin/stdout)',
    herramientas: [
      {
        nombre: 'safewalk_listar_ubicaciones',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Lista ubicaciones universitarias registradas con filtros opcionales de búsqueda y límite.'
      },
      {
        nombre: 'safewalk_consultar_ubicacion',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Obtiene detalles de una ubicación específica por id_ubicacion.'
      },
      {
        nombre: 'safewalk_listar_rutas',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Lista rutas peatonales registradas con nivel de seguridad y tiempo estimado.'
      },
      {
        nombre: 'safewalk_consultar_ruta',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Consulta la geometría y puntos de control de una ruta específica.'
      },
      {
        nombre: 'safewalk_listar_reportes',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Lista incidentes y alertas SOS filtrables por estado y nivel de riesgo.'
      },
      {
        nombre: 'safewalk_consultar_reporte',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Consulta un reporte específico sin revelar contraseñas ni datos sensibles.'
      },
      {
        nombre: 'safewalk_listar_servicios_emergencia',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Obtiene contactos y ubicaciones de servicios de emergencia (Policía, ECU911, Bomberos, Salud).'
      },
      {
        nombre: 'safewalk_listar_lugares_seguros',
        tipo: 'Lectura',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Lista puntos de refugio y zonas seguras dentro y fuera del campus.'
      },
      {
        nombre: 'safewalk_crear_reporte',
        tipo: 'Escritura Controlada',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Registra un reporte de incidente. Requiere confirmacion_explicita: true.'
      },
      {
        nombre: 'safewalk_crear_contacto_emergencia',
        tipo: 'Escritura Controlada',
        rolRequerido: 'ESTUDIANTE | ADMINISTRADOR',
        descripcion: 'Agrega un contacto telefónico de apoyo personal. Requiere confirmacion_explicita: true.'
      },
      {
        nombre: 'safewalk_actualizar_estado_reporte',
        tipo: 'Escritura Controlada (ADMINISTRATIVO)',
        rolRequerido: 'ADMINISTRADOR',
        descripcion: 'Permite a un administrador revisar, validar o rechazar un reporte. Requiere confirmacion_explicita: true.'
      }
    ],
    recursos: [
      { uri: 'safewalk://openapi', descripcion: 'Especificación completa OpenAPI 3.0 en JSON.' },
      { uri: 'safewalk://estado-api', descripcion: 'Diagnóstico de disponibilidad de la API REST de SafeWalk U.' },
      { uri: 'safewalk://catalogo-capacidades', descripcion: 'Manual de capacidades y seguridad del servidor MCP.' }
    ],
    prompts: [
      { nombre: 'analizar_seguridad_ruta', descripcion: 'Plantilla guiada para evaluar la seguridad de una ruta peatonal combinando ubicaciones, zonas de riesgo y reportes recientes.' }
    ],
    restriccionesSeguridad: [
      'No se permite la ejecución directa de SQL ni conexión a la base de datos MySQL.',
      'No se exponen endpoints destructivos masivos ni modificación de cuentas de usuario.',
      'Todas las herramientas de escritura exigen el flag confirmacion_explicita: true.',
      'Validación estricta de esquemas Zod en todas las entradas.'
    ]
  };

  return JSON.stringify(catalog, null, 2);
}
