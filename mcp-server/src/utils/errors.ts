export class McpServerError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode?: number) {
    super(message);
    this.name = 'McpServerError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ApiCommunicationError extends McpServerError {
  constructor(message: string, statusCode?: number) {
    super(message, 'API_COMMUNICATION_ERROR', statusCode);
    this.name = 'ApiCommunicationError';
  }
}

export class AuthorizationError extends McpServerError {
  constructor(message: string = 'Permisos insuficientes para ejecutar esta herramienta.') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends McpServerError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class ConfirmationRequiredError extends McpServerError {
  constructor(actionDescription: string) {
    super(
      `Acción de escritura pendiente. Se requiere confirmación explícita para: ${actionDescription}. Por favor confirme pasando confirmacion_explicita: true.`,
      'CONFIRMATION_REQUIRED',
      422
    );
    this.name = 'ConfirmationRequiredError';
  }
}
