import { getConfig } from '../config.js';
import { ApiCommunicationError, AuthorizationError, ValidationError } from '../utils/errors.js';
import { sanitizeData } from '../security/sanitization.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  overrideToken?: string;
}

export class SafeWalkApiClient {
  private baseUrl: string;
  private defaultToken: string;
  private timeoutMs: number;
  private readonly maxResponseBytes: number;
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 4;
  private readonly recentRequests: number[] = [];

  constructor() {
    const config = getConfig();
    this.baseUrl = config.apiBaseUrl;
    this.defaultToken = config.apiToken;
    this.timeoutMs = config.timeoutMs;
    this.maxResponseBytes = config.maxResponseBytes;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    this.enforceLocalRateLimit();
    if (this.activeRequests >= this.maxConcurrentRequests) {
      throw new ApiCommunicationError('El servidor MCP tiene demasiadas solicitudes en curso. Intente nuevamente en unos segundos.', 429);
    }
    this.activeRequests += 1;
    try {
      return await this.performRequest<T>(endpoint, options);
    } finally {
      this.activeRequests -= 1;
    }
  }

  private async performRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const token = options.overrideToken || this.defaultToken;
    const method = options.method || 'GET';

    // Construir URL con parámetros de consulta
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'SafeWalk-MCP-Server/1.0.0'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > this.maxResponseBytes) throw new ApiCommunicationError('La respuesta de SafeWalk U supera el limite permitido.', 413);
      if (!contentType.toLowerCase().includes('application/json')) throw new ApiCommunicationError('SafeWalk U devolvio un formato de respuesta inesperado.', response.status);
      const rawBody = await response.text();
      if (Buffer.byteLength(rawBody, 'utf8') > this.maxResponseBytes) throw new ApiCommunicationError('La respuesta de SafeWalk U supera el limite permitido.', 413);
      let data: unknown;
      try { data = JSON.parse(rawBody); }
      catch { throw new ApiCommunicationError('SafeWalk U devolvio JSON invalido.', response.status); }

      if (!response.ok) {
        this.handleErrorResponse(response.status, data);
      }

      const payload = data && typeof data === 'object' && 'success' in data && (data as { success?: unknown }).success === true && 'data' in data
        ? (data as { data: unknown }).data
        : data;
      return sanitizeData(payload as T);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof AuthorizationError || err instanceof ValidationError || err instanceof ApiCommunicationError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiCommunicationError(`Tiempo de espera agotado (${this.timeoutMs}ms) al conectar con SafeWalk U.`, 504);
      }
      const errMessage = err instanceof Error ? err.message : 'Error desconocido de red';
      console.error(`[API ERROR] ${method} ${endpoint}:`, errMessage);
      throw new ApiCommunicationError('No se pudo comunicar con la API de SafeWalk U. Verifique su disponibilidad e intente nuevamente.');
    }
  }

  private enforceLocalRateLimit(): void {
    const now = Date.now();
    while (this.recentRequests.length && this.recentRequests[0] <= now - 60_000) this.recentRequests.shift();
    if (this.recentRequests.length >= 60) throw new ApiCommunicationError('Se alcanzo el limite local de 60 solicitudes por minuto.', 429);
    this.recentRequests.push(now);
  }

  private handleErrorResponse(status: number, body: unknown): never {
    let apiMessage = '';
    if (body && typeof body === 'object' && 'message' in body) {
      apiMessage = String((body as { message: unknown }).message);
    }

    switch (status) {
      case 401:
        throw new AuthorizationError(apiMessage || 'Token JWT ausente, inválido o expirado en SafeWalk U.');
      case 403:
        throw new AuthorizationError(apiMessage || 'Acceso denegado: El token no posee los permisos requeridos para esta acción.');
      case 404:
        throw new ApiCommunicationError(apiMessage || 'Recurso no encontrado en SafeWalk U.', 404);
      case 409:
        throw new ApiCommunicationError(apiMessage || 'Conflicto con el estado actual del recurso.', 409);
      case 422:
        throw new ValidationError(apiMessage || 'Error de validación reportado por la API de SafeWalk U.');
      case 429:
        throw new ApiCommunicationError('Límite de solicitudes excedido (Rate limit) en SafeWalk U. Intente más tarde.', 429);
      default:
        throw new ApiCommunicationError(apiMessage || `Error del servidor SafeWalk U (HTTP ${status}).`, status);
    }
  }
}
