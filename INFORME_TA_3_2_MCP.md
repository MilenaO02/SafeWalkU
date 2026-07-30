# Informe de Implementación Servidor MCP SafeWalk U (Actividad TA-3.2)

## 1. Resumen Ejecutivo
Se implementó un servidor **Model Context Protocol (MCP)** completo, seguro y alineado con la especificación **OpenAPI 3.0** para la plataforma **SafeWalk U**. El servidor opera mediante transporte `stdio`, permitiendo la integración nativa con **Claude Desktop** sin conectar el asistente directamente a la base de datos MySQL en AWS EC2, conservando todas las validaciones de negocio, autenticación JWT, autorización por roles y rate limiting de la API REST HTTPS (`https://safewalku.online/api`).

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Desktop                      │
│                  (Cliente AI / Agent)                   │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Transporte stdio (stdin/stdout)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Servidor MCP SafeWalk U                    │
│     (TypeScript + SDK @modelcontextprotocol/sdk)        │
│                                                         │
│ ┌──────────────────────┐   ┌──────────────────────────┐ │
│ │  Tools (Zod Schema)  │   │ Resources (OpenAPI/State)│ │
│ └──────────────────────┘   └──────────────────────────┘ │
│ ┌──────────────────────┐   ┌──────────────────────────┐ │
│ │  Prompts (Seguridad) │   │ Security & Sanitization  │ │
│ └──────────────────────┘   └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTPS + Authorization: Bearer <token>
                             ▼
┌─────────────────────────────────────────────────────────┐
│               API REST HTTPS SafeWalk U                 │
│             (https://safewalku.online/api)              │
│       Node.js / Express + Middleware Auth & Roles       │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Pool de Conexiones TCP (Puerto 3306)
                             ▼
┌─────────────────────────────────────────────────────────┐
│             Base de Datos MySQL (AWS EC2)               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Justificación del Transporte (`stdio`)
- **Funcionamiento**: Claude Desktop ejecuta el servidor MCP como un subproceso local (`node dist/index.js`) y se comunica mediante flujos estándar de entrada/salida (`stdin` para peticiones JSON-RPC de Claude, `stdout` para respuestas MCP).
- **Ventajas de Seguridad**:
  - Elimina el riesgo de exposición en red local o pública al no abrir puertos TCP/HTTP en la máquina cliente.
  - La comunicación es local y privada entre el proceso de Claude Desktop y el servidor MCP.
  - Todos los logs diagnósticos y auditorías se emiten por `stderr`, garantizando que `stdout` se reserve 100% para mensajes estructurados JSON-RPC 2.0.
- **Comparación con Streamable HTTP**: Streamable HTTP es idóneo para agentes remotos distribuidos o arquitecturas Serverless; para clientes locales de escritorio como Claude Desktop, `stdio` es el estándar recomendado por el protocolo MCP por su mínima superficie de ataque.

---

## 4. Capacidades Implementadas

### A. Herramientas (Tools) - 11 en Total

#### Solo Lectura (Estudiantes y Administradores):
1. **`safewalk_listar_ubicaciones`**: Lista ubicaciones universitarias registradas con filtros por texto `q` y límite `limit`.
2. **`safewalk_consultar_ubicacion`**: Obtiene detalles de una ubicación por `id_ubicacion`.
3. **`safewalk_listar_rutas`**: Consulta rutas peatonales seguras filtrables por `nivel_seguridad`.
4. **`safewalk_consultar_ruta`**: Consulta la geometría y puntos de control de una ruta por `id_ruta`.
5. **`safewalk_listar_reportes`**: Lista incidentes y alertas pánico filtrables por `estado` y `nivel_riesgo`.
6. **`safewalk_consultar_reporte`**: Obtiene el detalle de un reporte por `id_reporte`.
7. **`safewalk_listar_servicios_emergencia`**: Lista el directorio de servicios de emergencia (Policía, ECU911, Bomberos, Salud).
8. **`safewalk_listar_lugares_seguros`**: Lista puntos de refugio y garitas de seguridad universitarias.

#### Escritura Controlada (Exigen `confirmacion_explicita: true`):
9. **`safewalk_crear_reporte`**: Envía un nuevo reporte de incidente a SafeWalk U.
10. **`safewalk_crear_contacto_emergencia`**: Registra un contacto personal de apoyo.
11. **`safewalk_actualizar_estado_reporte`**: **Herramienta Administrativa**. Cambia el estado de un reporte (`VALIDADO`, `RECHAZADO`, `DUPLICADO`, `CANCELADO`). Exige token JWT con rol `ADMINISTRADOR`.

### B. Recursos (Resources) - 3 en Total
1. **`safewalk://openapi`**: Entrega el contrato completo de la API en formato OpenAPI 3.0 sanitizado.
2. **`safewalk://estado-api`**: Proporciona diagnóstico en vivo de la disponibilidad del backend de producción (`/api/health`).
3. **`safewalk://catalogo-capacidades`**: Describe de forma estructurada las herramientas, restricciones y permisos del servidor MCP.

### C. Prompts - 1 en Total
1. **`analizar_seguridad_ruta`**: Guía a Claude para evaluar la seguridad de un trayecto combinando ubicaciones, lugares seguros, reportes e incidentes recientes.

---

## 5. Hardening y Controles de Seguridad

1. **Principio de Mínimo Privilegio**: Sin acceso directo a MySQL; interacción canalizada por la API REST HTTPS.
2. **Validación Estricta de Entradas**: Esquemas Zod que verifican latitud (`-90` a `90`), longitud (`-180` a `180`), expresiones regulares de teléfonos (`^\+?[0-9][0-9\s-]{6,19}$`) y límites de paginación (`1-100`).
3. **Confirmación Humana Obligatoria**: Cualquier operación POST, PUT o DELETE requiere la presencia de `confirmacion_explicita: true`.
4. **Protección de Secretos**: `SAFEWALK_API_TOKEN` es leído desde variables de entorno y censurado en los logs. `.env` está incluido en `.gitignore`.
5. **Prevención de Prompt Injection**: Sanitización automática de textos obtenidos de la base de datos para evitar que contenido generado por usuarios redefina instrucciones del modelo.
6. **Auditoría Diagnóstica**: Registro en `stderr` indicando timestamp, nombre de la tool, duración en milisegundos y resultado (`SUCCESS` / `FAIL`).

---

## 6. Configuración de Claude Desktop (`claude_desktop_config.json`)

**Ruta en Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "safewalk-u": {
      "command": "node",
      "args": [
        "C:\\Users\\milen\\Downloads\\safewalku2\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "SAFEWALK_API_BASE_URL": "https://safewalku.online/api",
        "SAFEWALK_API_TOKEN": "REEMPLAZAR_CON_TOKEN_JWT_VALIDO"
      }
    }
  }
}
```

---

## 7. Pruebas Realizadas y Resultados

| Prueba | Tipo | Resultado | Descripción |
| :--- | :--- | :--- | :--- |
| `npm install` | Instalación | ✅ Éxito | Instalación de `@modelcontextprotocol/sdk` y `zod` |
| `npm run lint` | Estática | ✅ 0 Errores | Verificación de tipos TypeScript (`tsc --noEmit`) |
| `npm run build` | Compilación | ✅ Éxito | Generación de archivos JavaScript en `dist/` |
| Inicio stdio | Ejecución | ✅ Éxito | Inicialización limpia y logs únicamente por `stderr` |
| Autenticación | Seguridad | ✅ Éxito | Rechazo de endpoints sin token o con token inválido |
| Roles | Autorización | ✅ Éxito | Rechazo local 403 para `safewalk_actualizar_estado_reporte` con rol ESTUDIANTE |
| Confirmación | Escritura | ✅ Éxito | `ConfirmationRequiredError` al omitir `confirmacion_explicita: true` |
