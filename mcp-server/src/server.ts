import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { SafeWalkApiClient } from './api/safewalk-client.js';
import { formatToolSuccess, formatToolError } from './utils/response.js';

import { listarUbicaciones, consultarUbicacion } from './tools/ubicaciones.tools.js';
import { listarRutas, consultarRuta } from './tools/rutas.tools.js';
import { listarReportes, consultarReporte, crearReporte, actualizarEstadoReporte } from './tools/reportes.tools.js';
import { crearContactoEmergencia } from './tools/contactos.tools.js';
import { listarServiciosEmergencia, listarLugaresSeguros } from './tools/usuarios.tools.js';

import { getApiStatusResource } from './resources/api-status.resource.js';
import { getOpenApiResource, getCapabilitiesCatalogResource } from './resources/openapi.resource.js';

export function createMcpServer(): Server {
  const apiClient = new SafeWalkApiClient();

  const server = new Server(
    {
      name: 'safewalk-u-mcp-server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    }
  );

  // 1. REGISTRO DE HERRAMIENTAS (TOOLS)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'safewalk_listar_ubicaciones',
          description: 'Lista todas las ubicaciones universitarias registradas en SafeWalk U con filtros opcionales de búsqueda por texto (q) y límite de registros.',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Término de búsqueda opcional (mínimo 2 caracteres).' },
              limit: { type: 'number', description: 'Número máximo de registros a retornar (1-100).' }
            }
          }
        },
        {
          name: 'safewalk_consultar_ubicacion',
          description: 'Obtiene la información detallada y coordenadas de una ubicación específica según su id_ubicacion.',
          inputSchema: {
            type: 'object',
            required: ['id_ubicacion'],
            properties: {
              id_ubicacion: { type: 'number', description: 'ID numérico entero positivo de la ubicación.' }
            }
          }
        },
        {
          name: 'safewalk_listar_rutas',
          description: 'Lista las rutas peatonales seguras registradas, permitiendo filtrar por nivel_seguridad (BAJO, MEDIO, ALTO).',
          inputSchema: {
            type: 'object',
            properties: {
              nivel_seguridad: { type: 'string', enum: ['BAJO', 'MEDIO', 'ALTO'], description: 'Nivel de seguridad de la ruta.' },
              limit: { type: 'number', description: 'Límite de resultados (1-100).' }
            }
          }
        },
        {
          name: 'safewalk_consultar_ruta',
          description: 'Consulta los detalles, tramos y puntos de control geográficos de una ruta específica por id_ruta.',
          inputSchema: {
            type: 'object',
            required: ['id_ruta'],
            properties: {
              id_ruta: { type: 'number', description: 'ID numérico de la ruta.' }
            }
          }
        },
        {
          name: 'safewalk_listar_reportes',
          description: 'Lista los reportes de incidentes y alertas de pánico accesibles, con filtros por estado, nivel de riesgo y tipo de reporte.',
          inputSchema: {
            type: 'object',
            properties: {
              estado: { type: 'string', enum: ['PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO', 'CANCELADO'] },
              nivel_riesgo: { type: 'string', enum: ['BAJO', 'MEDIO', 'ALTO'] },
              tipo_reporte: { type: 'string', enum: ['INCIDENTE', 'SOS_PANICO'] },
              limit: { type: 'number', description: 'Límite de resultados (1-100).' }
            }
          }
        },
        {
          name: 'safewalk_consultar_reporte',
          description: 'Obtiene el detalle completo de un reporte específico por su id_reporte.',
          inputSchema: {
            type: 'object',
            required: ['id_reporte'],
            properties: {
              id_reporte: { type: 'number', description: 'ID numérico del reporte.' }
            }
          }
        },
        {
          name: 'safewalk_listar_servicios_emergencia',
          description: 'Obtiene el directorio de servicios de emergencia institucionales y externos (Policía, ECU911, Bomberos, Ambulancias).',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'safewalk_listar_lugares_seguros',
          description: 'Lista los puntos de ayuda, garitas de seguridad y refugios recomendados dentro y cerca del campus.',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'safewalk_crear_reporte',
          description: 'HERRAMIENTA DE ESCRITURA: Envía un nuevo reporte de incidente a SafeWalk U. Exige el parámetro confirmacion_explicita: true.',
          inputSchema: {
            type: 'object',
            required: ['descripcion', 'nivel_riesgo', 'latitud', 'longitud', 'confirmacion_explicita'],
            properties: {
              descripcion: { type: 'string', description: 'Descripción clara del incidente (5-500 caracteres).' },
              nivel_riesgo: { type: 'string', enum: ['BAJO', 'MEDIO', 'ALTO'] },
              latitud: { type: 'number', description: 'Coordenada latitud (-90 a 90).' },
              longitud: { type: 'number', description: 'Coordenada longitud (-180 a 180).' },
              precision_gps: { type: 'number', description: 'Precisión estimada en metros (def: 10).' },
              fecha_captura_gps: { type: 'string', description: 'Fecha e hora ISO de la captura.' },
              direccion_aproximada: { type: 'string', description: 'Dirección o referencia del lugar.' },
              confirmacion_explicita: { type: 'boolean', description: 'Debe ser true para confirmar la ejecución.' }
            }
          }
        },
        {
          name: 'safewalk_crear_contacto_emergencia',
          description: 'HERRAMIENTA DE ESCRITURA: Registra un contacto personal de apoyo de confianza. Exige el parámetro confirmacion_explicita: true.',
          inputSchema: {
            type: 'object',
            required: ['nombre', 'telefono', 'parentesco', 'confirmacion_explicita'],
            properties: {
              nombre: { type: 'string', description: 'Nombre completo del contacto (2-100 chars).' },
              telefono: { type: 'string', description: 'Número telefónico en formato estándar (+593991234567).' },
              parentesco: { type: 'string', enum: ['PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'AMIGO', 'PAREJA', 'OTRO'] },
              confirmacion_explicita: { type: 'boolean', description: 'Debe ser true para confirmar el registro.' }
            }
          }
        },
        {
          name: 'safewalk_actualizar_estado_reporte',
          description: 'HERRAMIENTA DE ESCRITURA (ROL ADMINISTRADOR): Revisa o cambia el estado de un reporte existente. Exige token con rol ADMINISTRADOR y confirmacion_explicita: true.',
          inputSchema: {
            type: 'object',
            required: ['id_reporte', 'estado', 'confirmacion_explicita'],
            properties: {
              id_reporte: { type: 'number', description: 'ID numérico del reporte a actualizar.' },
              estado: { type: 'string', enum: ['PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO', 'CANCELADO'] },
              descripcion: { type: 'string', description: 'Comentario o nota explicativa opcional.' },
              nivel_riesgo: { type: 'string', enum: ['BAJO', 'MEDIO', 'ALTO'] },
              confirmacion_explicita: { type: 'boolean', description: 'Debe ser true para confirmar el cambio de estado.' }
            }
          }
        }
      ]
    };
  });

  // EJECUCIÓN DE HERRAMIENTAS (CALL TOOL)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();

    try {
      let resultData: unknown;

      switch (name) {
        case 'safewalk_listar_ubicaciones':
          resultData = await listarUbicaciones(apiClient, args);
          break;
        case 'safewalk_consultar_ubicacion':
          resultData = await consultarUbicacion(apiClient, args);
          break;
        case 'safewalk_listar_rutas':
          resultData = await listarRutas(apiClient, args);
          break;
        case 'safewalk_consultar_ruta':
          resultData = await consultarRuta(apiClient, args);
          break;
        case 'safewalk_listar_reportes':
          resultData = await listarReportes(apiClient, args);
          break;
        case 'safewalk_consultar_reporte':
          resultData = await consultarReporte(apiClient, args);
          break;
        case 'safewalk_listar_servicios_emergencia':
          resultData = await listarServiciosEmergencia(apiClient);
          break;
        case 'safewalk_listar_lugares_seguros':
          resultData = await listarLugaresSeguros(apiClient);
          break;
        case 'safewalk_crear_reporte':
          resultData = await crearReporte(apiClient, args);
          break;
        case 'safewalk_crear_contacto_emergencia':
          resultData = await crearContactoEmergencia(apiClient, args);
          break;
        case 'safewalk_actualizar_estado_reporte':
          resultData = await actualizarEstadoReporte(apiClient, args);
          break;
        default:
          throw new Error(`La herramienta '${name}' no está registrada en el servidor MCP.`);
      }

      const durationMs = Date.now() - startTime;
      console.error(`[AUDIT] Tool executed: ${name} | Duration: ${durationMs}ms | Result: SUCCESS`);

      return formatToolSuccess(resultData);
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error(`[AUDIT] Tool failed: ${name} | Duration: ${durationMs}ms | Error: ${errMessage}`);
      return formatToolError(err);
    }
  });

  // 2. REGISTRO DE RECURSOS (RESOURCES)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'safewalk://openapi',
          name: 'Especificación OpenAPI 3.0 de SafeWalk U',
          description: 'Documento JSON con la especificación completa y sanitizada de la API REST de SafeWalk U.',
          mimeType: 'application/json'
        },
        {
          uri: 'safewalk://estado-api',
          name: 'Estado de disponibilidad de la API',
          description: 'Diagnóstico en tiempo real sobre la accesibilidad del servidor API REST de SafeWalk U.',
          mimeType: 'application/json'
        },
        {
          uri: 'safewalk://catalogo-capacidades',
          name: 'Catálogo de Capacidades y Seguridad MCP',
          description: 'Manual informativo de las herramientas, permisos por rol y políticas de seguridad del servidor MCP.',
          mimeType: 'application/json'
        }
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'safewalk://openapi') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: getOpenApiResource()
          }
        ]
      };
    }

    if (uri === 'safewalk://estado-api') {
      const statusText = await getApiStatusResource(apiClient);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: statusText
          }
        ]
      };
    }

    if (uri === 'safewalk://catalogo-capacidades') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: getCapabilitiesCatalogResource()
          }
        ]
      };
    }

    throw new Error(`Recurso no encontrado: ${uri}`);
  });

  // 3. REGISTRO DE PROMPTS (PROMPTS)
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'analizar_seguridad_ruta',
          description: 'Genera un análisis guiado de seguridad para una ruta o trayecto universitario combinando lugares seguros, servicios de emergencia y reportes en la zona.',
          arguments: [
            {
              name: 'origen',
              description: 'Lugar de partida o zona del campus',
              required: true
            },
            {
              name: 'destino',
              description: 'Destino planificado',
              required: true
            }
          ]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: promptArgs } = request.params;

    if (name === 'analizar_seguridad_ruta') {
      const origen = promptArgs?.origen || 'Origen no especificado';
      const destino = promptArgs?.destino || 'Destino no especificado';

      return {
        description: 'Instrucciones para evaluar el nivel de riesgo y recomendar puntos seguros.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Por favor analiza la seguridad del desplazamiento desde "${origen}" hasta "${destino}".
Sigue este procedimiento utilizando las herramientas de SafeWalk U:
1. Usa 'safewalk_listar_rutas' y 'safewalk_listar_ubicaciones' para identificar las opciones de camino disponibles.
2. Usa 'safewalk_listar_reportes' para revisar si hay incidentes o zonas de riesgo activas cercanas.
3. Consulta 'safewalk_listar_lugares_seguros' y 'safewalk_listar_servicios_emergencia' para recomendar puntos de ayuda a lo largo del trayecto.
4. Entrega una síntesis clara con recomendaciones preventivas y el nivel de seguridad estimado (BAJO, MEDIO o ALTO).`
            }
          }
        ]
      };
    }

    throw new Error(`Prompt no encontrado: ${name}`);
  });

  return server;
}
