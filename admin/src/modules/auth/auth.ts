import { api } from '../../services/api';

export interface AdminUser {
  id: number;
  usuario: string;
  nombre: string;
  activo?: boolean;
  rol?: string;
  idFacultad?: string | null;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
}

export const authService = {
  /**
   * Realiza la petición de autenticación asíncrona al backend
   */
  async login(usuario: string, contrasena: string): Promise<AdminUser> {
    const data = (await api.post('admin/auth', {
      usuario,
      password: contrasena,
    })) as LoginResponse;

    sessionStorage.setItem('admin_token', data.token);
    sessionStorage.setItem('admin_user', JSON.stringify(data.user));

    return data.user;
  },

  /**
   * Revoca el token en el servidor y limpia la sesión local
   */
  async logout(): Promise<void> {
    try {
      await api.post('admin/auth/logout');
    } catch (e) {
      console.warn('Revocación de token fallida en servidor:', e);
    } finally {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
    }
  },

  /**
   * Determina si existe una sesión administrativa activa
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Obtiene el token de la sesión activa
   */
  getToken(): string | null {
    return sessionStorage.getItem('admin_token');
  },

  /**
   * Obtiene el usuario autenticado
   */
  getUser(): AdminUser | null {
    const userStr = sessionStorage.getItem('admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as AdminUser;
    } catch {
      return null;
    }
  },
};
