const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || 'Solicitud fallida');
  }

  return data;
}

export const login = (payload) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const register = (payload) => request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export { buildApiUrl, API_BASE_URL };
