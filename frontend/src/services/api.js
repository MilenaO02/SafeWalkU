const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
let unauthorizedNotified = false;

function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401 && path !== '/auth/login' && !unauthorizedNotified) {
        unauthorizedNotified = true;
        window.dispatchEvent(new CustomEvent('safewalk:unauthorized'));
      }
      if (!isJson) {
        throw new Error(`El servidor respondió con un error de red o HTML (${response.status}). Por favor intente más tarde.`);
      }
      const msg = data?.message || (Array.isArray(data?.errors) ? data.errors.map(e => e.message || e).join(', ') : 'Solicitud fallida');
      throw new Error(msg);
    }

    if (path === '/auth/login') unauthorizedNotified = false;
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    throw error;
  }
}

export const login = (payload) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const register = (payload) => request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const checkHealth = () => request('/health', {
  method: 'GET',
});

export { buildApiUrl, API_BASE_URL, request };
