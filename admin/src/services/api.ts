const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('admin_token');
  const headers = new Headers(options.headers || {});

  // Adjuntar token si existe
  if (token && !path.includes('admin/auth')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Establecer JSON content-type por defecto al enviar body (excepto para FormData)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${BASE_URL}/${path.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Si no está autorizado, limpiar sesión y redirigir
  if (response.status === 401) {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    if (!path.includes('admin/auth') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    const errorMsg = data?.errors?.[0]?.message || data?.error || data?.message || 'Sesión expirada o no autorizada';
    throw new ApiError(401, errorMsg, data);
  }

  if (!response.ok) {
    const errorMsg = data?.errors?.[0]?.message || data?.error || data?.message || 'Error en la comunicación con el servidor';
    throw new ApiError(response.status, errorMsg, data);
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestInit) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (path: string, body?: any, options?: RequestInit) =>
    apiFetch(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: 'DELETE' }),
};
