import swaggerJsdoc from "swagger-jsdoc";
const bearer = [{ bearerAuth: [] }];
const standardResponses = {
    200: { description: "Operación correcta" },
    400: { description: "Solicitud inválida" },
    401: { description: "Sesión no válida" },
    403: { description: "Permiso insuficiente" },
    404: { description: "Recurso no encontrado" },
    422: { description: "Error de validación" }
};
const operation = (summary, security = bearer) => ({ summary, security, responses: standardResponses });
const idParameter = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];
const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "SafeWalk U API",
            version: "1.0.0",
            description: "Contrato REST para la plataforma web responsive de seguridad universitaria SafeWalk U."
        },
        servers: [{ url: "/api", description: "Servidor actual" }],
        components: {
            securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
            schemas: {
                ApiError: { type: "object", properties: { success: { type: "boolean", example: false }, message: { type: "string" } } },
                User: { type: "object", properties: { id_usuario: { type: "integer" }, nombre: { type: "string" }, apellido: { type: "string" }, correo: { type: "string", format: "email" }, rol: { type: "string", enum: ["ESTUDIANTE", "ADMINISTRADOR"] }, estado: { type: "string", enum: ["ACTIVO", "INACTIVO"] } } },
                Report: { type: "object", properties: { id_reporte: { type: "integer" }, descripcion: { type: "string" }, nivel_riesgo: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] }, estado: { type: "string", enum: ["PENDIENTE", "VALIDADO", "RECHAZADO", "DUPLICADO", "CANCELADO"] }, tipo_reporte: { type: "string", enum: ["INCIDENTE", "SOS_PANICO"] }, id_ubicacion: { type: "integer" } } },
                RoutePoint: { type: "object", required: ["latitud", "longitud"], properties: { latitud: { type: "number", minimum: -90, maximum: 90 }, longitud: { type: "number", minimum: -180, maximum: 180 }, tipo: { type: "string", enum: ["INICIO", "INTERMEDIO", "CRUCE", "APOYO", "DESTINO"] }, observacion: { type: "string", maxLength: 255 } } },
                Route: { type: "object", properties: { id_ruta: { type: "integer" }, nombre_ruta: { type: "string" }, nivel_seguridad: { type: "string" }, tiempo_estimado: { type: "integer" }, ubicaciones: { type: "array", items: { type: "integer" }, minItems: 2 }, puntos: { type: "array", items: { $ref: "#/components/schemas/RoutePoint" }, minItems: 2, maxItems: 500 } } },
                Location: { type: "object", properties: { id_ubicacion: { type: "integer" }, nombre: { type: "string" }, direccion: { type: "string" }, ciudad: { type: "string" }, latitud: { type: "number" }, longitud: { type: "number" }, categoria_segura: { type: "string", enum: ["LUGAR_SEGURO", "SERVICIO_EMERGENCIA"] }, detalle_seguridad: { type: "string" } } },
                TracedRoute: { type: "object", properties: { distancia_m: { type: "integer" }, tiempo_estimado: { type: "integer" }, fuente_trazado: { type: "string", enum: ["OPENROUTESERVICE", "TRAZADO_MANUAL", "REFERENCIAL"] }, trazado_peatonal: { type: "boolean" }, coordenadas: { type: "array", items: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } } }, aviso: { type: "string" } } },
                Contact: { type: "object", properties: { id_contacto: { type: "integer" }, nombre: { type: "string" }, telefono: { type: "string" }, parentesco: { type: "string" } } }
            }
        },
        security: bearer,
        paths: {
            "/health": { get: operation("Comprobar API y base de datos", []) },
            "/auth/register": { post: operation("Registrar estudiante", []) },
            "/auth/login": { post: operation("Iniciar sesión", []) },
            "/users": { get: operation("Listar usuarios activos (administrador)") },
            "/users/me": { get: operation("Consultar perfil actual"), put: operation("Actualizar perfil actual") },
            "/users/{id}": { get: { ...operation("Consultar usuario (administrador)"), parameters: idParameter }, put: { ...operation("Actualizar usuario (administrador)"), parameters: idParameter }, delete: { ...operation("Desactivar usuario (administrador)"), parameters: idParameter } },
            "/users/{id}/foto": { put: { ...operation("Actualizar fotografía de perfil"), parameters: idParameter } },
            "/reports": { get: operation("Listar reportes accesibles"), post: operation("Crear reporte") },
            "/reports/zonas/riesgo": { get: operation("Listar zonas de riesgo validadas") },
            "/reports/sos": { post: operation("Crear alerta SOS") },
            "/reports/sos/{id}/cancelar": { put: { ...operation("Cancelar alerta SOS propia"), parameters: idParameter } },
            "/reports/sos/{id}/atender": { put: { ...operation("Atender alerta SOS (administrador)"), parameters: idParameter } },
            "/reports/{id}": { get: { ...operation("Consultar reporte accesible"), parameters: idParameter }, put: { ...operation("Revisar reporte (administrador)"), parameters: idParameter }, delete: { ...operation("Desactivar reporte (administrador)"), parameters: idParameter } },
            "/evidencias": { get: operation("Listar evidencias (administrador)"), post: operation("Adjuntar evidencia") },
            "/evidencias/{id}": { get: { ...operation("Consultar evidencia accesible"), parameters: idParameter }, put: { ...operation("Reemplazar evidencia accesible"), parameters: idParameter }, delete: { ...operation("Eliminar evidencia accesible"), parameters: idParameter } },
            "/routes": { get: operation("Listar rutas"), post: operation("Crear ruta (administrador)") },
            "/routes/trazar": { get: { ...operation("Calcular trayecto peatonal hacia un destino seguro"), parameters: [{ name: "origen_lat", in: "query", required: true, schema: { type: "number", minimum: -90, maximum: 90 } }, { name: "origen_lng", in: "query", required: true, schema: { type: "number", minimum: -180, maximum: 180 } }, { name: "destino_id", in: "query", required: true, schema: { type: "integer", minimum: 1 } }] } },
            "/routes/{id}": { get: { ...operation("Consultar ruta"), parameters: idParameter }, put: { ...operation("Actualizar ruta (administrador)"), parameters: idParameter }, delete: { ...operation("Eliminar ruta (administrador)"), parameters: idParameter } },
            "/ubicaciones": { get: operation("Listar ubicaciones") },
            "/ubicaciones/buscar": { get: { ...operation("Buscar lugares seguros y servicios de emergencia"), parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 3, maxLength: 100 } }] } },
            "/ubicaciones/{id}/coordenadas": { put: { ...operation("Corregir nombre, direccion y coordenadas (administrador)"), parameters: idParameter } },
            "/dashboard/metricas": { get: operation("Consultar métricas (administrador)") },
            "/contacts": { get: operation("Listar contactos propios"), post: operation("Crear contacto propio") },
            "/contacts/{id}": { put: { ...operation("Actualizar contacto propio"), parameters: idParameter }, delete: { ...operation("Eliminar contacto propio"), parameters: idParameter } },
            "/services": { get: operation("Listar servicios de emergencia") },
            "/places": { get: operation("Listar lugares seguros") }
        }
    },
    apis: []
};
export default swaggerJsdoc(options);
