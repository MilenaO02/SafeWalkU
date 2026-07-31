# SafeWalk U MCP Server

Servidor MCP para Claude Desktop. Usa `stdio`: Claude Desktop inicia `node dist/index.js` como subproceso local; stdout se reserva para JSON-RPC y los diagnosticos se escriben solamente en stderr. El servidor no abre puertos ni se conecta directamente a MySQL.

## Arquitectura

```
Claude Desktop -> MCP stdio -> SafeWalk MCP -> HTTPS API Express -> MySQL EC2
```

El MCP consume `https://safewalku.online/api`, por lo que conserva la autenticacion JWT, los roles, validaciones Zod, reglas de negocio y rate limiting del backend.

## Instalacion

```powershell
cd mcp-server
npm install
npm run lint
npm run build
npm start
```

Copie `.env.example` a `.env` y establezca un JWT de una cuenta de demostracion con permisos minimos. `.env`, `dist` y `node_modules` estan ignorados por Git.

## Claude Desktop en Windows

Edite `%APPDATA%\Claude\claude_desktop_config.json` y reinicie completamente Claude Desktop:

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
        "SAFEWALK_API_TOKEN": "PEGAR_TOKEN_LOCALMENTE"
      }
    }
  }
}
```

No incluya un token real en archivos, commits, capturas ni documentacion.

## Capacidades

Tools de lectura:

- `safewalk_listar_ubicaciones`, `safewalk_consultar_ubicacion`
- `safewalk_listar_rutas`, `safewalk_consultar_ruta`
- `safewalk_listar_reportes`, `safewalk_consultar_reporte`
- `safewalk_listar_servicios_emergencia`, `safewalk_listar_lugares_seguros`

Tools de escritura controlada:

- `safewalk_crear_reporte`
- `safewalk_crear_contacto_emergencia`
- `safewalk_actualizar_estado_reporte` (solo JWT ADMINISTRADOR)

Toda escritura requiere `confirmacion_explicita: true`. El MCP no expone operaciones masivas, usuarios, contrasenas, tokens, archivos arbitrarios ni SQL.

Resources: `safewalk://openapi`, `safewalk://estado-api` y `safewalk://catalogo-capacidades`.

Prompt: `analizar_seguridad_ruta`.

## Controles de seguridad

- Zod estricto, IDs positivos, limites de coordenadas y limite de resultados 1-100.
- Telefono de diez digitos, igual al contrato del backend.
- JWT unicamente por variable de entorno; los valores sensibles se censuran.
- Timeout, limite de respuesta de 1 MB, maximo de 4 solicitudes concurrentes y 60 por minuto en el proceso MCP.
- No se reintentan POST/PUT/PATCH/DELETE automaticamente.
- Los reportes eliminan nombre, apellido, correo, telefono e identificador de usuario antes de enviarse a Claude.
- Auditoria de nombre de tool, resultado y duracion en stderr, sin payloads ni tokens.

## Evidencias TA-3.2

Para la entrega capture: el arbol `mcp-server/src`, `npm run lint`, `npm run build`, Claude Desktop mostrando `safewalk-u`, la lista de tools, una lectura con JWT de prueba, un rechazo por entrada invalida y un rechazo 403 de la tool administrativa con JWT de estudiante. Oculte siempre el JWT.
