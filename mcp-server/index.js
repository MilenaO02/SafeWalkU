import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Configuración del servidor
const API_URL = process.env.SAFEWALKU_API_URL || "https://safewalku.online/api";
const server = new McpServer({
    name: "SafeWalkU-MCP-Server",
    version: "1.0.0",
});

// Herramienta 1: Comprobar estado de la API
server.tool(
    "health_check",
    "Comprueba el estado de salud de la API y de la Base de Datos de SafeWalk U",
    {},
    async () => {
        try {
            const response = await axios.get(`${API_URL}/health`);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error de conexión: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Iniciar el servidor
async function run() {
    console.error("Iniciando servidor MCP SafeWalk U...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Servidor MCP SafeWalk U en ejecución.");
}

run().catch(console.error);
