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
  const timeoutMs = Number(process.env.SAFEWALK_TIMEOUT_MS || 10000);
  const maxResponseBytes = Number(process.env.SAFEWALK_MAX_RESPONSE_BYTES || 1048576);

  if (!/^https:\/\//i.test(apiBaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\//i.test(apiBaseUrl)) {
    throw new Error('SAFEWALK_API_BASE_URL debe usar HTTPS (o localhost durante desarrollo).');
  }
  
  if (!apiToken) {
    console.error('[CONFIG WARNING] SAFEWALK_API_TOKEN no está configurado en las variables de entorno. Las solicitudes autenticadas pueden fallar.');
  }

  return {
    apiBaseUrl,
    apiToken,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 30000 ? timeoutMs : 10000,
    maxResponseBytes: Number.isFinite(maxResponseBytes) && maxResponseBytes >= 1024 && maxResponseBytes <= 2_097_152 ? maxResponseBytes : 1_048_576,
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info'
  };
}
