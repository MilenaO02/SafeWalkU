# SafeWalk U - MCP Server

Este servidor implementa el protocolo Model Context Protocol (MCP) para exponer las funcionalidades de SafeWalk U a clientes compatibles con MCP como Claude Desktop.

## Instalación

1. Asegúrate de tener Node.js instalado.
2. Ejecuta `npm install` dentro de esta carpeta.

## Configuración de Claude Desktop

Añade lo siguiente a tu archivo de configuración de Claude Desktop (usualmente `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "safewalku": {
      "command": "node",
      "args": ["/ruta/absoluta/a/safewalku2/mcp-server/index.js"],
      "env": {
        "SAFEWALKU_API_URL": "https://safewalku.online/api"
      }
    }
  }
}
```

## Herramientas Expuestas
- `health_check`: Comprueba el estado de salud de la API.
