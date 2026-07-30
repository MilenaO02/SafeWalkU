import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServerError } from './errors.js';

export function formatToolSuccess(data: unknown, message?: string): CallToolResult {
  const payload = {
    status: 'success',
    ...(message ? { message } : {}),
    data
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

export function formatToolError(error: unknown): CallToolResult {
  let errorMessage = 'Ocurrió un error inesperado durante la ejecución.';
  let errorCode = 'INTERNAL_ERROR';

  if (error instanceof McpServerError) {
    errorMessage = error.message;
    errorCode = error.code;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const payload = {
    status: 'error',
    code: errorCode,
    message: errorMessage
  };

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}
