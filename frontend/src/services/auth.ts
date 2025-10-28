import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: {
    id: number;
    nombre: string;
    nivel_acceso: number;
  } | null;
  is_active: boolean;
  is_staff: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

const authService = {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/core/auth/login/', credentials);
    
    // Guardar tokens en localStorage
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtener el usuario actual
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/core/usuarios/me/');
    return response.data;
  },

  /**
   * Refrescar el token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ access: string }>('/core/auth/refresh/', {
      refresh: refreshToken,
    });

    localStorage.setItem('access_token', response.data.access);
    return response.data.access;
  },

  /**
   * Verificar token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await api.post('/core/auth/verify/', { token });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Registrar nuevo usuario (si aplica para usuarios normales)
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/core/usuarios/', data);
    return response.data;
  },
};

export default authService;

