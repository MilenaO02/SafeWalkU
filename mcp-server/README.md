# SafeWalk U - Model Context Protocol (MCP) Server

Servidor **Model Context Protocol (MCP)** oficial para la plataforma **SafeWalk U**. Este servidor permite integrar asistentes de Inteligencia Artificial (como **Claude Desktop**) de forma segura con la arquitectura universitaria de SafeWalk U a través de su API REST HTTPS existente.

---

## 🏗️ Arquitectura de Comunicación

```
[Claude Desktop (AI Assistant)]
       │
       │  Transporte stdio (stdin / stdout)
       ▼
[Servidor MCP SafeWalk U (TypeScript / Node.js)]
       │
       │  HTTPS + Bearer JWT + Rate Limiting + Validaciones Zod
       ▼
[API REST HTTPS de SafeWalk U (https://safewalku.online/api)]
       │
       │  Pool de Conexiones MySQL + Seguridad backend
       ▼
[Base de Datos MySQL en AWS EC2]
```

> **Nota de Seguridad Crítica**: Claude Desktop **NUNCA** se conecta directamente a la base de datos MySQL ni ejecuta consultas SQL arbitrarias. Todas las interacciones pasan obligatoriamente por las reglas de negocio, validaciones y autorización por roles de la API REST de SafeWalk U.

---

## 🚀 Instalación y Compilación

1. **Instalar dependencias**:
   ```bash
   cd mcp-server
   npm install
   ```

2. **Compilar el proyecto TypeScript**:
   ```bash
   npm run build
   ```

3. **Verificar el compilado**:
   Se creará la carpeta `dist/` conteniendo `dist/index.js` y `dist/server.js`.

---

## 🛠️ Herramientas Expuestas (Tools)

### Herramientas de Solo Lectura (Estudiante / Administrador):
1. **`safewalk_listar_ubicaciones`**: Lista ubicaciones universitarias registradas con filtros por texto `q` y límite `limit`.
2. **`safewalk_consultar_ubicacion`**: Obtiene detalles de una ubicación por `id_ubicacion`.
3. **`safewalk_listar_rutas`**: Consulta rutas peatonales seguras filtrables por `nivel_seguridad`.
4. **`safewalk_consultar_ruta`**: Consulta la geometría y puntos de control de una ruta por `id_ruta`.
5. **`safewalk_listar_reportes`**: Lista incidentes y alertas pánico filtrables por `estado` y `nivel_riesgo`.
6. **`safewalk_consultar_reporte`**: Obtiene el detalle de un reporte por `id_reporte`.
7. **`safewalk_listar_servicios_emergencia`**: Lista el directorio de servicios de emergencia (Policía, ECU911, Bomberos, Salud).
8. **`safewalk_listar_lugares_seguros`**: Lista puntos de refugio y garitas de seguridad universitarias.

### Herramientas de Escritura Controlada:
9. **`safewalk_crear_reporte`**: Registra un reporte de incidente. Requiere `confirmacion_explicita: true`.
10. **`safewalk_crear_contacto_emergencia`**: Agrega un contacto de apoyo. Requiere `confirmacion_explicita: true`.
11. **`safewalk_actualizar_estado_reporte`**: Actualiza el estado de un reporte. **Requiere token con rol ADMINISTRADOR** y `confirmacion_explicita: true`.

---

## 📦 Recursos (Resources)
- **`safewalk://openapi`**: Especificación OpenAPI 3.0 completa y sanitizada de SafeWalk U.
- **`safewalk://estado-api`**: Diagnóstico en tiempo real de la disponibilidad de la API REST de producción.
- **`safewalk://catalogo-capacidades`**: Catálogo informativo de permisos, tools y restricciones de seguridad.

---

## 💡 Prompts
- **`analizar_seguridad_ruta`**: Plantilla interactiva para evaluar el riesgo de un trayecto combinando reportes, rutas y lugares seguros.

---

## 🛡️ Medidas de Hardening y Seguridad

1. **Principio de Mínimo Privilegio**: Exposición controlada de endpoints mediante la API REST sin acceso SQL directo.
2. **Validación Estricta con Zod**: Verificación de rangos latitud (-90 a 90), longitud (-180 a 180), formato de teléfono y rechazo de campos desconocidos.
3. **Confirmación Humana Obligatoria**: Las acciones de escritura (POST, PUT, DELETE) requieren explícitamente `confirmacion_explicita: true`.
4. **Protección de Secretos**: Tokens y Authorization no se registran en los archivos de log. Los logs diagnósticos van únicamente a `stderr`.
5. **Aislamiento Stdio**: Ningún puerto de red adicional es abierto por el servidor MCP en modo `stdio`.

---

## ⚙️ Configuración en Claude Desktop (Windows)

Edita o crea el archivo de configuración de Claude Desktop en Windows:

**Ruta del archivo en Windows:**
`%APPDATA%\Claude\claude_desktop_config.json`
*(Ejemplo: `C:\Users\tu_usuario\AppData\Roaming\Claude\claude_desktop_config.json`)*

**Contenido JSON:**
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
        "SAFEWALK_API_TOKEN": "TU_TOKEN_JWT_DE_SAFEWALK_AQUI"
      }
    }
  }
}
```

> **Pasos para aplicar**:
> 1. Reemplaza `TU_TOKEN_JWT_DE_SAFEWALK_AQUI` con tu JWT obtenido al iniciar sesión en SafeWalk U.
> 2. Cierra completamente Claude Desktop (desde el Administrador de Tareas o icono en la barra de tareas).
> 3. Vuelve a abrir Claude Desktop y verás el icono 🔨 indicando las herramientas activas de **safewalk-u**.
