import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

async function main() {
  // CRÍTICO: Redirigir cualquier console.log accidental a console.error para no corromper la comunicación JSON-RPC en stdout
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    console.error('[STDOUT_REDIRECT]', ...args);
  };

  console.error('[SAFEWALK MCP] Iniciando servidor Model Context Protocol...');
  console.error('[SAFEWALK MCP] Transporte: stdio (stdin/stdout)');

  const server = createMcpServer();
  const transport = new StdioServerTransport();

  const shutdown = async () => {
    console.error('[SAFEWALK MCP] Apagando servidor MCP limpiamente...');
    try {
      await server.close();
    } catch (err) {
      console.error('[SAFEWALK MCP ERROR]', err);
    }
    console.log = originalLog;
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.connect(transport);
    console.error('[SAFEWALK MCP] Servidor MCP conectado exitosamente. Listo para peticiones de Claude Desktop.');
  } catch (err) {
    console.error('[SAFEWALK MCP FATAL] Error al iniciar el servidor MCP:', err);
    console.log = originalLog;
    process.exit(1);
  }
}

main();
