export interface Config {
  apiBaseUrl: string;
  apiToken: string;
  timeoutMs: number;
  maxResponseBytes: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function getConfig(): Config {
  const apiBaseUrl = (process.env.SAFEWALK_API_BASE_URL || 'https://safewalku.online/api').replace(/\/$/, '');
  const apiToken = process.env.SAFEWALK_API_TOKEN || '';
  
  if (!apiToken) {
    console.error('[CONFIG WARNING] SAFEWALK_API_TOKEN no está configurado en las variables de entorno. Las solicitudes autenticadas pueden fallar.');
  }

  return {
    apiBaseUrl,
    apiToken,
    timeoutMs: parseInt(process.env.SAFEWALK_TIMEOUT_MS || '10000', 10),
    maxResponseBytes: parseInt(process.env.SAFEWALK_MAX_RESPONSE_BYTES || '1048576', 10), // 1MB
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info'
  };
}
