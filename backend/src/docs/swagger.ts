const bearer = [{ bearerAuth: [] }];

const jsonContent = (schema: object) => ({
    "application/json": { schema }
});

const response = (description: string, schema?: object) => ({
    description,
    ...(schema ? { content: jsonContent(schema) } : {})
});

const errorDescriptions: Record<number, string> = {
    400: "Solicitud invalida",
    401: "Token ausente, invalido o vencido",
    403: "Permiso insuficiente",
    404: "Recurso no encontrado",
    409: "Conflicto con el estado actual",
    413: "Archivo demasiado grande",
    422: "Error de validacion",
    429: "Limite de solicitudes excedido",
    500: "Error interno del servidor"
};

const errors = (...codes: number[]) => Object.fromEntries(
    codes.map((code) => [code, response(errorDescriptions[code], { $ref: "#/components/schemas/ApiError" })])
);

type OperationOptions = {
    tags: string[];
    public?: boolean;
    roles?: string[];
    parameters?: object[];
    requestBody?: object;
    responses: Record<number, object>;
};

const operation = (summary: string, options: OperationOptions) => ({
    summary,
    tags: options.tags,
    security: options.public ? [] : bearer,
    ...(options.roles ? { "x-roles": options.roles } : {}),
    ...(options.parameters ? { parameters: options.parameters } : {}),
    ...(options.requestBody ? { requestBody: options.requestBody } : {}),
    responses: options.responses
});

const jsonBody = (schema: object) => ({ required: true, content: jsonContent(schema) });
const multipartBody = (schema: object) => ({ required: true, content: { "multipart/form-data": { schema } } });
const idParameter = [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }];

const locationGet = operation("Listar ubicaciones", {
    tags: ["Ubicaciones"],
    roles: ["ESTUDIANTE", "ADMINISTRADOR"],
    responses: { 200: response("Ubicaciones disponibles"), ...errors(401, 403, 500) }
});

const locationSearch = operation("Buscar lugares seguros y servicios de emergencia", {
    tags: ["Ubicaciones"],
    roles: ["ESTUDIANTE", "ADMINISTRADOR"],
    parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 3, maxLength: 100 } }],
    responses: { 200: response("Resultados de la busqueda"), ...errors(400, 401, 403, 500) }
});

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "SafeWalk U API",
        version: "1.0.0",
        description: "Contrato REST de la plataforma web responsive SafeWalk U. Las extensiones x-roles indican los roles autorizados por la aplicacion."
    },
    servers: [
        { url: "/api", description: "Mismo origen (produccion o desarrollo)" },
        { url: "https://safewalku.online/api", description: "Produccion" }
    ],
    tags: [
        { name: "Salud" }, { name: "Autenticacion" }, { name: "Usuarios" },
        { name: "Reportes" }, { name: "Evidencias" }, { name: "Rutas" },
        { name: "Ubicaciones" }, { name: "Dashboard" }, { name: "Contactos" },
        { name: "Servicios" }, { name: "Lugares" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
        },
        schemas: {
            ApiError: {
                type: "object",
                required: ["success", "message"],
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                    errors: { type: "array", items: {} }
                }
            },
            RegisterRequest: {
                type: "object",
                additionalProperties: false,
                required: ["nombre", "apellido", "correo", "contrasena"],
                properties: {
                    nombre: { type: "string", minLength: 2, maxLength: 100 },
                    apellido: { type: "string", minLength: 2, maxLength: 100 },
                    correo: { type: "string", format: "email", pattern: "@uide\\.edu\\.ec$", example: "estudiante@uide.edu.ec" },
                    contrasena: { type: "string", format: "password", minLength: 8, maxLength: 72, description: "Debe incluir minuscula, mayuscula y numero" }
                }
            },
            LoginRequest: {
                type: "object",
                additionalProperties: false,
                required: ["correo", "contrasena"],
                properties: {
                    correo: { type: "string", format: "email", pattern: "@uide\\.edu\\.ec$" },
                    contrasena: { type: "string", format: "password", minLength: 1, maxLength: 72 }
                }
            },
            SwitchRoleRequest: {
                type: "object",
                additionalProperties: false,
                required: ["rol"],
                properties: { rol: { type: "string", enum: ["ESTUDIANTE", "ADMINISTRADOR"] } }
            },
            UserUpdateRequest: {
                type: "object",
                additionalProperties: false,
                minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 2, maxLength: 100 },
                    apellido: { type: "string", minLength: 2, maxLength: 100 },
                    correo: { type: "string", format: "email", pattern: "@uide\\.edu\\.ec$" }
                }
            },
            User: {
                type: "object",
                properties: {
                    id_usuario: { type: "integer" }, nombre: { type: "string" }, apellido: { type: "string" },
                    correo: { type: "string", format: "email" },
                    rol: { type: "string", enum: ["ESTUDIANTE", "ADMINISTRADOR"] },
                    roles: { type: "array", items: { type: "string", enum: ["ESTUDIANTE", "ADMINISTRADOR"] } },
                    estado: { type: "string", enum: ["ACTIVO", "INACTIVO"] }, foto_perfil: { type: "string", nullable: true }
                }
            },
            AuthResponse: {
                type: "object",
                required: ["success", "token", "usuario"],
                properties: {
                    success: { type: "boolean", example: true }, token: { type: "string", description: "JWT" },
                    usuario: { $ref: "#/components/schemas/User" }, data: { type: "object" }
                }
            },
            ReportCreateRequest: {
                type: "object", additionalProperties: false, required: ["descripcion", "nivel_riesgo", "id_ubicacion"],
                properties: {
                    descripcion: { type: "string", minLength: 5, maxLength: 500 },
                    nivel_riesgo: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
                    id_ubicacion: { type: "integer", minimum: 1 }
                }
            },
            ReportUpdateRequest: {
                type: "object", additionalProperties: false, minProperties: 1,
                properties: {
                    descripcion: { type: "string", minLength: 5, maxLength: 500 },
                    nivel_riesgo: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
                    estado: { type: "string", enum: ["PENDIENTE", "VALIDADO", "RECHAZADO", "DUPLICADO"] }
                }
            },
            SosCreateRequest: {
                type: "object", additionalProperties: false, required: ["id_ubicacion"],
                properties: {
                    descripcion: { type: "string", minLength: 5, maxLength: 500, default: "Alerta SOS activada por el usuario" },
                    id_ubicacion: { type: "integer", minimum: 1 }
                }
            },
            Report: {
                type: "object",
                properties: {
                    id_reporte: { type: "integer" }, descripcion: { type: "string" },
                    nivel_riesgo: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
                    estado: { type: "string", enum: ["PENDIENTE", "VALIDADO", "RECHAZADO", "DUPLICADO", "CANCELADO"] },
                    tipo_reporte: { type: "string", enum: ["INCIDENTE", "SOS_PANICO"] },
                    id_usuario: { type: "integer" }, id_ubicacion: { type: "integer" }, id_administrador: { type: "integer", nullable: true }
                }
            },
            ContactRequest: {
                type: "object", additionalProperties: false, required: ["nombre", "telefono", "parentesco"],
                properties: {
                    nombre: { type: "string", minLength: 2, maxLength: 100 },
                    telefono: { type: "string", pattern: "^\\+?[0-9][0-9\\s-]{6,19}$" },
                    parentesco: { type: "string", enum: ["PADRE", "MADRE", "HERMANO", "HERMANA", "AMIGO", "PAREJA", "OTRO"] }
                }
            },
            ContactUpdateRequest: {
                type: "object", additionalProperties: false, minProperties: 1,
                properties: {
                    nombre: { type: "string", minLength: 2, maxLength: 100 },
                    telefono: { type: "string", pattern: "^\\+?[0-9][0-9\\s-]{6,19}$" },
                    parentesco: { type: "string", enum: ["PADRE", "MADRE", "HERMANO", "HERMANA", "AMIGO", "PAREJA", "OTRO"] }
                }
            },
            RoutePoint: {
                type: "object", additionalProperties: false, required: ["latitud", "longitud"],
                properties: {
                    latitud: { type: "number", minimum: -90, maximum: 90 }, longitud: { type: "number", minimum: -180, maximum: 180 },
                    tipo: { type: "string", enum: ["INICIO", "INTERMEDIO", "CRUCE", "APOYO", "DESTINO"] },
                    observacion: { type: "string", maxLength: 255 }
                }
            },
            RouteRequest: {
                type: "object", additionalProperties: false,
                required: ["nombre_ruta", "nivel_seguridad", "tiempo_estimado", "ubicaciones", "puntos"],
                properties: {
                    nombre_ruta: { type: "string", minLength: 3, maxLength: 100 }, descripcion: { type: "string", maxLength: 255 },
                    nivel_seguridad: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
                    tiempo_estimado: { type: "integer", minimum: 1, maximum: 1440 },
                    ubicaciones: { type: "array", minItems: 2, maxItems: 50, uniqueItems: true, items: { type: "integer", minimum: 1 } },
                    puntos: { type: "array", minItems: 2, maxItems: 500, items: { $ref: "#/components/schemas/RoutePoint" } }
                }
            },
            RouteUpdateRequest: {
                type: "object", additionalProperties: false, minProperties: 1,
                properties: {
                    nombre_ruta: { type: "string", minLength: 3, maxLength: 100 }, descripcion: { type: "string", maxLength: 255 },
                    nivel_seguridad: { type: "string", enum: ["BAJO", "MEDIO", "ALTO"] },
                    tiempo_estimado: { type: "integer", minimum: 1, maximum: 1440 },
                    ubicaciones: { type: "array", minItems: 2, maxItems: 50, uniqueItems: true, items: { type: "integer", minimum: 1 } },
                    puntos: { type: "array", minItems: 2, maxItems: 500, items: { $ref: "#/components/schemas/RoutePoint" } }
                }
            },
            LocationUpdateRequest: {
                type: "object", additionalProperties: false, required: ["nombre", "direccion", "latitud", "longitud"],
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 100 }, direccion: { type: "string", minLength: 3, maxLength: 255 },
                    latitud: { type: "number", minimum: -4.15, maximum: -3.8 }, longitud: { type: "number", minimum: -79.35, maximum: -79.05 }
                }
            }
        }
    },
    paths: {
        "/health": { get: operation("Comprobar API y MySQL", { tags: ["Salud"], public: true, responses: { 200: response("API en linea y estado de MySQL"), 503: response("MySQL no disponible"), ...errors(500) } }) },
        "/auth/register": { post: operation("Registrar estudiante institucional", { tags: ["Autenticacion"], public: true, requestBody: jsonBody({ $ref: "#/components/schemas/RegisterRequest" }), responses: { 201: response("Usuario registrado"), ...errors(400, 409, 422, 429, 500) } }) },
        "/auth/login": { post: operation("Iniciar sesion", { tags: ["Autenticacion"], public: true, requestBody: jsonBody({ $ref: "#/components/schemas/LoginRequest" }), responses: { 200: response("Sesion iniciada", { $ref: "#/components/schemas/AuthResponse" }), ...errors(400, 401, 422, 429, 500) } }) },
        "/auth/switch-role": { post: operation("Cambiar el modo activo de una cuenta con acceso dual", { tags: ["Autenticacion"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/SwitchRoleRequest" }), responses: { 200: response("Modo cambiado y JWT renovado", { $ref: "#/components/schemas/AuthResponse" }), ...errors(401, 403, 422, 500) } }) },
        "/users": { get: operation("Listar usuarios activos", { tags: ["Usuarios"], roles: ["ADMINISTRADOR"], responses: { 200: response("Usuarios activos"), ...errors(401, 403, 500) } }) },
        "/users/me": {
            get: operation("Consultar perfil actual", { tags: ["Usuarios"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Perfil actual"), ...errors(401, 403, 404, 500) } }),
            put: operation("Actualizar perfil actual", { tags: ["Usuarios"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/UserUpdateRequest" }), responses: { 200: response("Perfil actualizado"), ...errors(400, 401, 403, 409, 422, 500) } })
        },
        "/users/{id}": {
            get: operation("Consultar usuario", { tags: ["Usuarios"], roles: ["ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Usuario encontrado"), ...errors(400, 401, 403, 404, 500) } }),
            put: operation("Actualizar usuario", { tags: ["Usuarios"], roles: ["ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/UserUpdateRequest" }), responses: { 200: response("Usuario actualizado"), ...errors(400, 401, 403, 404, 409, 422, 500) } }),
            delete: operation("Desactivar usuario mediante borrado logico", { tags: ["Usuarios"], roles: ["ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Usuario desactivado"), ...errors(400, 401, 403, 404, 409, 500) } })
        },
        "/users/{id}/foto": { put: operation("Actualizar fotografia propia o de un usuario", { tags: ["Usuarios"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, requestBody: multipartBody({ type: "object", required: ["imagen"], properties: { imagen: { type: "string", format: "binary" } } }), responses: { 200: response("Fotografia actualizada"), ...errors(400, 401, 403, 404, 413, 500) } }) },
        "/reports": {
            get: operation("Listar reportes accesibles", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Reportes accesibles"), ...errors(401, 403, 500) } }),
            post: operation("Crear reporte de incidente", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/ReportCreateRequest" }), responses: { 201: response("Reporte creado"), ...errors(400, 401, 403, 422, 500) } })
        },
        "/reports/zonas/riesgo": { get: operation("Listar zonas de riesgo validadas", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: [{ name: "ciudad", in: "query", required: false, schema: { type: "string", default: "Loja" } }], responses: { 200: response("Zonas de riesgo"), ...errors(401, 403, 500) } }) },
        "/reports/sos": { post: operation("Crear alerta SOS", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/SosCreateRequest" }), responses: { 201: response("SOS activado"), ...errors(400, 401, 403, 409, 422, 500) } }) },
        "/reports/sos/{id}/cancelar": { put: operation("Cancelar alerta SOS propia", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("SOS cancelado"), ...errors(400, 401, 403, 404, 500) } }) },
        "/reports/sos/{id}/atender": { put: operation("Atender alerta SOS", { tags: ["Reportes"], roles: ["ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("SOS atendido"), ...errors(400, 401, 403, 404, 500) } }) },
        "/reports/{id}": {
            get: operation("Consultar reporte accesible", { tags: ["Reportes"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Reporte encontrado"), ...errors(400, 401, 403, 404, 500) } }),
            put: operation("Revisar reporte", { tags: ["Reportes"], roles: ["ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/ReportUpdateRequest" }), responses: { 200: response("Reporte actualizado"), ...errors(400, 401, 403, 404, 422, 500) } }),
            delete: operation("Desactivar reporte", { tags: ["Reportes"], roles: ["ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Reporte desactivado"), ...errors(400, 401, 403, 404, 500) } })
        },
        "/evidencias": {
            get: operation("Listar evidencias", { tags: ["Evidencias"], roles: ["ADMINISTRADOR"], responses: { 200: response("Evidencias"), ...errors(401, 403, 500) } }),
            post: operation("Adjuntar evidencia", { tags: ["Evidencias"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: multipartBody({ type: "object", required: ["archivo", "id_reporte"], properties: { archivo: { type: "string", format: "binary" }, id_reporte: { type: "integer", minimum: 1 } } }), responses: { 201: response("Evidencia creada"), ...errors(400, 401, 403, 404, 413, 500) } })
        },
        "/evidencias/{id}": {
            get: operation("Consultar evidencia propia o accesible como administrador", { tags: ["Evidencias"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Evidencia encontrada"), ...errors(400, 401, 403, 404, 500) } }),
            put: operation("Reemplazar evidencia propia o accesible como administrador", { tags: ["Evidencias"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, requestBody: multipartBody({ type: "object", required: ["archivo"], properties: { archivo: { type: "string", format: "binary" } } }), responses: { 200: response("Evidencia actualizada"), ...errors(400, 401, 403, 404, 413, 500) } }),
            delete: operation("Eliminar evidencia propia o accesible como administrador", { tags: ["Evidencias"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Evidencia eliminada"), ...errors(400, 401, 403, 404, 500) } })
        },
        "/routes": {
            get: operation("Listar rutas", { tags: ["Rutas"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Rutas"), ...errors(401, 403, 500) } }),
            post: operation("Crear ruta", { tags: ["Rutas"], roles: ["ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/RouteRequest" }), responses: { 201: response("Ruta creada"), ...errors(400, 401, 403, 422, 500) } })
        },
        "/routes/trazar": { get: operation("Calcular trayecto hacia un destino seguro", { tags: ["Rutas"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: [{ name: "origen_lat", in: "query", required: true, schema: { type: "number", minimum: -90, maximum: 90 } }, { name: "origen_lng", in: "query", required: true, schema: { type: "number", minimum: -180, maximum: 180 } }, { name: "destino_id", in: "query", required: false, schema: { type: "integer", minimum: 1 } }, { name: "destino_lat", in: "query", required: false, schema: { type: "number", minimum: -90, maximum: 90 } }, { name: "destino_lng", in: "query", required: false, schema: { type: "number", minimum: -180, maximum: 180 } }, { name: "destino_nombre", in: "query", required: false, schema: { type: "string" } }, { name: "destino_direccion", in: "query", required: false, schema: { type: "string" } }], responses: { 200: response("Trayecto calculado o referencia identificada"), ...errors(400, 401, 403, 404, 422, 500) } }) },
        "/routes/{id}": {
            get: operation("Consultar ruta", { tags: ["Rutas"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Ruta encontrada"), ...errors(400, 401, 403, 404, 500) } }),
            put: operation("Actualizar ruta", { tags: ["Rutas"], roles: ["ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/RouteUpdateRequest" }), responses: { 200: response("Ruta actualizada"), ...errors(400, 401, 403, 404, 422, 500) } }),
            delete: operation("Eliminar ruta", { tags: ["Rutas"], roles: ["ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Ruta eliminada"), ...errors(400, 401, 403, 404, 500) } })
        },
        "/ubicaciones": { get: locationGet },
        "/ubicaciones/buscar": { get: locationSearch },
        "/ubicaciones/{id}/coordenadas": { put: operation("Corregir ubicacion y coordenadas", { tags: ["Ubicaciones"], roles: ["ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/LocationUpdateRequest" }), responses: { 200: response("Ubicacion actualizada"), ...errors(400, 401, 403, 404, 422, 500) } }) },
        "/locations": { get: locationGet },
        "/locations/buscar": { get: locationSearch },
        "/locations/{id}/coordenadas": { put: operation("Corregir ubicacion y coordenadas (alias)", { tags: ["Ubicaciones"], roles: ["ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/LocationUpdateRequest" }), responses: { 200: response("Ubicacion actualizada"), ...errors(400, 401, 403, 404, 422, 500) } }) },
        "/dashboard/metricas": { get: operation("Consultar metricas", { tags: ["Dashboard"], roles: ["ADMINISTRADOR"], responses: { 200: response("Metricas actuales"), ...errors(401, 403, 500) } }) },
        "/contacts": {
            get: operation("Listar contactos propios", { tags: ["Contactos"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Contactos propios"), ...errors(401, 403, 500) } }),
            post: operation("Crear contacto propio", { tags: ["Contactos"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], requestBody: jsonBody({ $ref: "#/components/schemas/ContactRequest" }), responses: { 201: response("Contacto creado"), ...errors(400, 401, 403, 409, 422, 500) } })
        },
        "/contacts/{id}": {
            put: operation("Actualizar contacto propio", { tags: ["Contactos"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, requestBody: jsonBody({ $ref: "#/components/schemas/ContactUpdateRequest" }), responses: { 200: response("Contacto actualizado"), ...errors(400, 401, 403, 404, 422, 500) } }),
            delete: operation("Eliminar contacto propio", { tags: ["Contactos"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], parameters: idParameter, responses: { 200: response("Contacto eliminado"), ...errors(400, 401, 403, 404, 500) } })
        },
        "/services": { get: operation("Listar servicios de emergencia", { tags: ["Servicios"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Servicios de emergencia"), ...errors(401, 403, 500) } }) },
        "/places": { get: operation("Listar lugares seguros", { tags: ["Lugares"], roles: ["ESTUDIANTE", "ADMINISTRADOR"], responses: { 200: response("Lugares seguros"), ...errors(401, 403, 500) } }) }
    }
};

export default swaggerSpec;
