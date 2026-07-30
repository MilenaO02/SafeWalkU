import { SafeWalkApiClient } from '../api/safewalk-client.js';

export async function getApiStatusResource(client: SafeWalkApiClient): Promise<string> {
  const startTime = Date.now();
  let isAvailable = false;
  let statusDetail: unknown = null;

  try {
    statusDetail = await client.request<unknown>('/health');
    isAvailable = true;
  } catch (err: unknown) {
    statusDetail = {
      message: err instanceof Error ? err.message : 'No se pudo conectar a la API de SafeWalk U'
    };
  }

  const durationMs = Date.now() - startTime;

  const payload = {
    resource: 'safewalk://estado-api',
    timestamp: new Date().toISOString(),
    api: {
      status: isAvailable ? 'ONLINE' : 'OFFLINE',
      responseTimeMs: durationMs,
      healthEndpoint: '/api/health',
      response: statusDetail
    }
  };

  return JSON.stringify(payload, null, 2);
}
