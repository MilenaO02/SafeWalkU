const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Module-level flag that prevents a flood of duplicate "session expired" events.
// It is reset after a successful login AND after every 401 so that a single
// real expiry notification is always surfaced on the next request.
let unauthorizedNotified = false;

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildApiUrl(path), { ...options, headers });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401 && path !== '/auth/login') {
        if (!unauthorizedNotified) {
          unauthorizedNotified = true;
          window.dispatchEvent(new CustomEvent('safewalk:unauthorized'));
        }
        // Always reset after dispatching so the next real 401 is surfaced too
        unauthorizedNotified = false;
      }

      if (!isJson) {
        throw new Error(
          `El servidor respondió con un error de red o HTML (${response.status}). Por favor intenta más tarde.`
        );
      }

      const fieldErrors = Array.isArray(data?.errors)
        ? data.errors.map((e) => e.message || e).filter(Boolean).join(', ')
        : '';
      throw new Error(fieldErrors || data?.message || 'Solicitud fallida');
    }

    // Reset the flag after a successful login so the next expiry is reported
    if (path === '/auth/login') unauthorizedNotified = false;

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    throw error;
  }
}

export function buildAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const serverBase = API_BASE_URL.replace(/\/api$/, '');
  return `${serverBase}${normalizedPath}`;
}

export const login = (payload) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });

export const register = (payload) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const checkHealth = () => request('/health', { method: 'GET' });

export { API_BASE_URL };
