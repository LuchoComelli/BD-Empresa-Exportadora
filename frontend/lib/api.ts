// API service para conectar con el backend Django

declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Interfaz para tokens JWT
interface TokenResponse {
  access: string;
  refresh: string;
}

// Interfaz para usuario
interface UserResponse {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  rol?: {
    id: number;
    nombre: string;
    nivel_acceso?: number;
  };
  empresa?: any;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Obtener token de localStorage
  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  // Obtener refresh token de localStorage
  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // Guardar tokens en localStorage
  private setTokens(access: string, refresh: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  // Eliminar tokens de localStorage
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Hacer petición con autenticación
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAccessToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si el token expiró, intentar refrescarlo
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Reintentar la petición con el nuevo token
          headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            throw new Error(`Error ${retryResponse.status}: ${retryResponse.statusText}`);
          }
          return retryResponse.json();
        } else {
          // Si no se pudo refrescar, limpiar tokens y redirigir
          this.clearTokens();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      }

      if (!response.ok) {
        let error;
        try {
          const errorText = await response.text();
          error = JSON.parse(errorText);
        } catch (e) {
          error = { detail: response.statusText };
        }
        
        // Si hay errores de validación del serializer, construir mensaje detallado
        let errorMessage = error.detail || `Error ${response.status}: ${response.statusText}`;
        
        if (error && typeof error === 'object' && !error.detail) {
          // Hay errores de campo específicos
          const fieldErrors = Object.keys(error)
            .map(key => {
              const fieldError = error[key];
              if (Array.isArray(fieldError)) {
                return `${key}: ${fieldError.join(', ')}`;
              }
              return `${key}: ${fieldError}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Métodos HTTP helpers
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Login
  async login(email: string, password: string): Promise<TokenResponse> {
    console.log(`[API] Intentando login con email: ${email}`);
    
    const response = await fetch(`${this.baseURL}/core/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password }), // El backend espera 'username' pero con el valor del email
    });

    console.log(`[API] Respuesta del servidor: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let error;
      try {
        const errorText = await response.text();
        console.error('[API] Error response text:', errorText);
        error = JSON.parse(errorText);
      } catch (e) {
        error = { detail: 'Error de autenticación' };
      }
      console.error('[API] Error de autenticación:', error);
      
      // El backend devuelve errores en formato { 'email': ['mensaje'], 'password': ['mensaje'] }
      let errorMessage = 'Credenciales inválidas';
      
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.email && Array.isArray(error.email)) {
        errorMessage = error.email[0];
      } else if (error.password && Array.isArray(error.password)) {
        errorMessage = error.password[0];
      } else if (error.username && Array.isArray(error.username)) {
        errorMessage = error.username[0];
      } else if (error.email) {
        errorMessage = error.email;
      } else if (error.password) {
        errorMessage = error.password;
      } else if (error.username) {
        errorMessage = error.username;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('[API] Error message final:', errorMessage);
      throw new Error(errorMessage);
    }

    const data: TokenResponse = await response.json();
    console.log('[API] Login exitoso');
    this.setTokens(data.access, data.refresh);
    return data;
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/core/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data: TokenResponse = await response.json();
      this.setTokens(data.access, data.refresh);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/core/usuarios/me/');
  }

  // Obtener solicitud de registro del usuario actual
  async getMiPerfil(): Promise<any> {
    return this.request<any>('/registro/solicitudes/mi_perfil/');
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<any> {
    return this.request<any>('/registro/solicitudes/estadisticas/');
  }

  // Obtener estadísticas públicas (sin autenticación)
  async getPublicStats(): Promise<any> {
    return this.requestPublic<any>('/registro/solicitudes/estadisticas_publicas/');
  }
  
  // Hacer petición pública sin autenticación
  private async requestPublic<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let error;
        try {
          const errorText = await response.text();
          error = JSON.parse(errorText);
        } catch (e) {
          error = { detail: response.statusText };
        }
        
        let errorMessage = error.detail || `Error ${response.status}: ${response.statusText}`;
        
        if (error && typeof error === 'object' && !error.detail) {
          const fieldErrors = Object.keys(error)
            .map(key => {
              const fieldError = error[key];
              if (Array.isArray(fieldError)) {
                return `${key}: ${fieldError.join(', ')}`;
              }
              return `${key}: ${fieldError}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Actualizar solicitud de registro
  async updatePerfil(solicitudId: number, data: any): Promise<any> {
    return this.patch<any>(`/registro/solicitudes/${solicitudId}/`, data);
  }

  // Obtener lista de empresas (solicitudes aprobadas)
  async getEmpresas(params?: {
    search?: string;
    estado?: string;
    tipo_empresa?: string;
    exporta?: string;
    importa?: string;
    departamento?: string;
    rubro?: string;
    sub_rubro?: string;
    categoria_matriz?: string;
    promo2idiomas?: string;
    certificadopyme?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    // Obtener todas las empresas de todos los tipos y combinarlas
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tipo_empresa) queryParams.append('tipo_empresa', params.tipo_empresa);
    if (params?.exporta) queryParams.append('exporta', params.exporta);
    if (params?.importa) queryParams.append('importa', params.importa);
    if (params?.departamento) queryParams.append('departamento', params.departamento);
    if (params?.rubro) queryParams.append('id_rubro', params.rubro);
    if (params?.sub_rubro) queryParams.append('sub_rubro', params.sub_rubro);
    if (params?.categoria_matriz) queryParams.append('categoria_matriz', params.categoria_matriz);
    if (params?.promo2idiomas) queryParams.append('promo2idiomas', params.promo2idiomas);
    if (params?.certificadopyme) queryParams.append('certificadopyme', params.certificadopyme);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    
    // Si hay filtro de tipo_empresa, solo obtener ese tipo (optimización)
    let endpoints: string[] = []
    if (params?.tipo_empresa && params.tipo_empresa !== 'all') {
      if (params.tipo_empresa === 'producto') {
        endpoints = [`/empresas/empresas-producto/${query ? `?${query}` : ''}`]
      } else if (params.tipo_empresa === 'servicio') {
        endpoints = [`/empresas/empresas-servicio/${query ? `?${query}` : ''}`]
      } else if (params.tipo_empresa === 'mixta') {
        endpoints = [`/empresas/empresas-mixta/${query ? `?${query}` : ''}`]
      }
    }
    
    // Si no hay filtro de tipo o no se especificó, obtener todos los tipos
    if (endpoints.length === 0) {
      endpoints = [
        `/empresas/empresas-producto/${query ? `?${query}` : ''}`,
        `/empresas/empresas-servicio/${query ? `?${query}` : ''}`,
        `/empresas/empresas-mixta/${query ? `?${query}` : ''}`,
      ]
    }
    
    // Limpiar endpoints: remover la barra final si no hay query params
    endpoints = endpoints.map(ep => ep.replace(/\/$/, ''))
    
    // Obtener empresas con manejo de errores
    const resultados = await Promise.allSettled(
      endpoints.map(endpoint => this.get<any>(endpoint))
    );
    
    // Procesar resultados exitosos
    const allResults = resultados
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
    
    // Combinar resultados
    const allEmpresas = allResults.flatMap(result => 
      result.results || (Array.isArray(result) ? result : [])
    );
    
    // Si hay paginación, calcular totales
    const total = allResults.reduce((sum, result) => 
      sum + (result.count || (Array.isArray(result) ? result.length : 0)), 0
    );
    
    return {
      results: allEmpresas,
      count: total,
    };
  }

  // Obtener una empresa por ID (sin importar tipo)
  async getEmpresaById(id: number): Promise<any> {
    // Intentar obtener de cada tipo hasta encontrar la empresa.
    // Nota: el backend a veces responde 404 con cuerpos de error tipo
    // "No Empresaproducto matches the given query." que llegan como
    // mensajes y se muestran al usuario. Aquí los tratamos como "no encontrado"
    // y seguimos intentando con los otros endpoints para no romper la UX.

    const endpoints = [
      `/empresas/empresas-producto/${id}/`,
      `/empresas/empresas-servicio/${id}/`,
      `/empresas/empresas-mixta/${id}/`,
    ];

    const notFoundPattern = /No \w+ matches the given query\.|does not exist|Not found/i;

    for (const ep of endpoints) {
      try {
        // Usar fetch directamente para manejar 404 sin lanzar errores
        const token = this.getAccessToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseURL}${ep}`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const empresa = await response.json();
          // Normalizar: asegurar que siempre retornamos un objeto con id
          if (empresa && empresa.id) {
            // Normalizar nombres de relación: algunos serializers usan `servicios` o `productos`,
            // otros pueden exponer `servicios_empresa` o `productos_empresa`. Unificar mínimamente.
            if (!empresa.servicios && empresa.servicios_empresa) {
              empresa.servicios = empresa.servicios_empresa;
            }
            if (!empresa.servicios && empresa.servicios_mixta) {
              empresa.servicios = empresa.servicios_mixta;
            }
            if (!empresa.productos && empresa.productos_empresa) {
              empresa.productos = empresa.productos_empresa;
            }
            if (!empresa.productos && empresa.productos_mixta) {
              empresa.productos = empresa.productos_mixta;
            }
            return empresa;
          }
        } else if (response.status === 404) {
          // 404 es esperado cuando intentamos el endpoint incorrecto, continuar con el siguiente
          continue;
        } else {
          // Para otros errores HTTP, intentar parsear el error pero no lanzarlo aún
          try {
            const errorText = await response.text();
            const error = JSON.parse(errorText);
            const msg = error.detail || error.message || response.statusText;
            if (notFoundPattern.test(msg)) {
              // Es un "not found" esperado, continuar
              continue;
            }
            // Es un error real, lanzarlo
            throw new Error(msg);
          } catch (parseErr) {
            // Si no se puede parsear, continuar con el siguiente endpoint
            continue;
          }
        }
      } catch (err: any) {
        // Si el error es un "not found" típico del serializer/DRF, lo ignoramos y probamos siguiente endpoint.
        const msg = err && err.message ? String(err.message) : '';
        if (notFoundPattern.test(msg)) {
          // continuar con el siguiente endpoint sin propagar el error
          continue;
        }
        // Para otros errores más serios, re-lanzamos
        throw err;
      }
    }

    throw new Error('Empresa no encontrada');
  }

  // Actualizar una empresa por ID
  async updateEmpresa(id: number, data: any): Promise<any> {
    // Determinar el tipo de empresa desde los datos o intentar cada endpoint
    const tipoEmpresa = data.tipo_empresa || data.tipo_empresa_valor;
    
    if (tipoEmpresa === 'producto' || tipoEmpresa === 'productos') {
      return this.patch<any>(`/empresas/empresas-producto/${id}/`, data);
    } else if (tipoEmpresa === 'servicio' || tipoEmpresa === 'servicios') {
      return this.patch<any>(`/empresas/empresas-servicio/${id}/`, data);
    } else if (tipoEmpresa === 'mixta' || tipoEmpresa === 'ambos') {
      return this.patch<any>(`/empresas/empresas-mixta/${id}/`, data);
    }
    
    // Si no se especifica, intentar cada uno
    try {
      return await this.patch<any>(`/empresas/empresas-producto/${id}/`, data);
    } catch (e) {
      try {
        return await this.patch<any>(`/empresas/empresas-servicio/${id}/`, data);
      } catch (e2) {
        return await this.patch<any>(`/empresas/empresas-mixta/${id}/`, data);
      }
    }
  }

  // Exportar empresas aprobadas a PDF
  async exportEmpresasPDF(params?: {
    search?: string;
    tipo_empresa?: string;
    exporta?: string;
    departamento?: string;
    rubro?: string;
    categoria_matriz?: string;
    campos?: string[];
    periodo?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tipo_empresa) queryParams.append('tipo_empresa', params.tipo_empresa);
    if (params?.exporta) queryParams.append('exporta', params.exporta);
    if (params?.departamento) queryParams.append('departamento', params.departamento);
    if (params?.rubro) queryParams.append('rubro', params.rubro);
    if (params?.categoria_matriz) queryParams.append('categoria_matriz', params.categoria_matriz);
    if (params?.campos) {
      params.campos.forEach(campo => queryParams.append('campos', campo));
    }
    
    const query = queryParams.toString();
    const token = this.getAccessToken();
    // Corregir la URL: no debe tener barra final antes del query string
    const url = `${this.baseURL}/registro/solicitudes/empresas_aprobadas/exportar_pdf${query ? `?${query}` : ''}`;
    
    console.log("Exportando PDF a URL:", url);
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log("Respuesta del servidor:", response.status, response.statusText);
    console.log("Content-Type:", response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error del servidor:", errorText);
      throw new Error(`Error al exportar PDF: ${response.statusText} - ${errorText}`);
    }
    
    const blob = await response.blob();
    console.log("Blob recibido, tamaño:", blob.size, "tipo:", blob.type);
    
    // Verificar que el blob sea un PDF válido
    if (blob.size === 0) {
      throw new Error('El PDF generado está vacío');
    }
    
    return blob;
  }

  // Eliminar una empresa por ID
  async deleteEmpresa(id: number, tipo_empresa?: string): Promise<any> {
    // Determinar el endpoint según el tipo de empresa
    if (tipo_empresa === 'producto') {
      return this.delete<any>(`/empresas/empresas-producto/${id}/`);
    } else if (tipo_empresa === 'servicio') {
      return this.delete<any>(`/empresas/empresas-servicio/${id}/`);
    } else if (tipo_empresa === 'mixta') {
      return this.delete<any>(`/empresas/empresas-mixta/${id}/`);
    }
    // Si no se especifica el tipo, intentar eliminar desde el endpoint unificado
    return this.delete<any>(`/registro/solicitudes/empresas_aprobadas/${id}/eliminar/`);
  }

  // Registrar nueva empresa
  async register(data: any): Promise<any> {
    return this.post<any>('/registro/solicitudes/', data);
  }

  // Obtener solicitudes de registro
  async getSolicitudes(params?: {
    estado?: string;
    search?: string;
    tipo_empresa?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tipo_empresa) queryParams.append('tipo_empresa', params.tipo_empresa);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.get<any>(`/registro/solicitudes/${query ? `?${query}` : ''}`);
  }

  // ========== USUARIOS ==========
  
  // Obtener lista de usuarios
  async getUsuarios(params?: {
    search?: string;
    is_active?: boolean;
    rol?: number;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.rol) queryParams.append('rol', params.rol.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    const url = query ? `/core/usuarios/?${query}` : '/core/usuarios/';
    return this.get<any>(url);
  }

  // Obtener un usuario por ID
  async getUsuarioById(id: number): Promise<any> {
    return this.get<any>(`/core/usuarios/${id}/`);
  }

  // Crear un nuevo usuario
  async createUsuario(data: any): Promise<any> {
    return this.post<any>('/core/usuarios/', data);
  }

  // Actualizar un usuario
  async updateUsuario(id: number, data: any): Promise<any> {
    return this.patch<any>(`/core/usuarios/${id}/`, data);
  }

  // Activar/desactivar usuario
  async toggleActiveUsuario(id: number): Promise<any> {
    return this.post<any>(`/core/usuarios/${id}/toggle_active/`);
  }

  // Obtener lista de roles
  async getRoles(): Promise<any> {
    return this.get<any>('/core/roles/');
  }

  // Logout
  logout(): void {
    this.clearTokens();
  }

  // ========== MATRIZ DE CLASIFICACIÓN ==========
  
  // Calcular puntajes de matriz automáticamente para una empresa
  async calcularPuntajesMatriz(empresaId: number): Promise<{
    empresa_id: number;
    tipo_empresa: string;
    razon_social: string;
    puntajes: {
      experiencia_exportadora: number;
      volumen_produccion: number;
      presencia_digital: number;
      posicion_arancelaria: number;
      participacion_internacionalizacion: number;
      estructura_interna: number;
      interes_exportador: number;
      certificaciones_nacionales: number;
      certificaciones_internacionales: number;
    };
    puntaje_total: number;
    puntaje_maximo: number;
    categoria: string;
  }> {
    return this.request<any>(`/empresas/matriz-clasificacion/calcular-puntajes/${empresaId}/`);
  }

  // Guardar evaluación de matriz
  async guardarEvaluacionMatriz(data: {
    empresa: number; // ID del modelo Empresa unificado
    experiencia_exportadora: number;
    volumen_produccion: number;
    presencia_digital: number;
    posicion_arancelaria: number;
    participacion_internacionalizacion: number;
    estructura_interna: number;
    interes_exportador: number;
    certificaciones_nacionales: number;
    certificaciones_internacionales: number;
    observaciones?: string;
  }): Promise<any> {
    return this.post<any>('/empresas/matriz-clasificacion/', data);
  }

  // ========== GEOGRAFÍA ARGENTINA ==========
  
// ========== GEOGRAFÍA CATAMARCA ==========
  
  // Obtener todos los departamentos de Catamarca
  async getDepartamentos(): Promise<any[]> {
    // Solo obtiene departamentos de Catamarca (provincia ID = 10)
    return this.get<any[]>('/geografia/departamentos/?provincia=10');
  }

  // Obtener municipios por departamento (usando ID del departamento)
  async getMunicipiosPorDepartamento(departamentoId: number | string): Promise<any[]> {
    return this.get<any[]>(`/geografia/municipios/?departamento=${departamentoId}`);
  }

  // Obtener localidades por municipio (usando ID del municipio)
  async getLocalidadesPorMunicipio(municipioId: number | string): Promise<any[]> {
    return this.get<any[]>(`/geografia/localidades/?municipio=${municipioId}`);
  }

  // Obtener localidades por departamento (usando ID del departamento)
  async getLocalidadesPorDepartamento(departamentoId: number | string): Promise<any[]> {
    return this.get<any[]>(`/geografia/localidades/?departamento=${departamentoId}`);
  }

  // Obtener rubros por tipo
  async getRubrosPorTipo(tipo: 'producto' | 'servicio'): Promise<any[]> {
    return this.get<any[]>(`/empresas/rubros/?tipo=${tipo}&activo=true`);
  }

  // Obtener todos los rubros
  async getRubros(): Promise<any[]> {
    return this.get<any[]>(`/empresas/rubros/?activo=true`);
  }

  // Obtener subrubros por rubro
  async getSubRubrosPorRubro(rubroId: string): Promise<any[]> {
    return this.get<any[]>(`/empresas/subrubros/?rubro=${rubroId}&activo=true`);
  }

  // ========== CONFIGURACIÓN DEL SISTEMA ==========
  
  // Obtener configuración del sistema
  async getConfiguracion(): Promise<any> {
    return this.get<any>('/core/configuracion/');
  }

  // Actualizar configuración del sistema
  async updateConfiguracion(data: {
    nombre_sistema?: string;
    institucion?: string;
    email_contacto?: string;
    telefono?: string;
    direccion?: string;
    paises_destino?: number;
    valor_exportado?: string;
    beneficio1_titulo?: string;
    beneficio1_descripcion?: string;
    beneficio2_titulo?: string;
    beneficio2_descripcion?: string;
    beneficio3_titulo?: string;
    beneficio3_descripcion?: string;
  }): Promise<any> {
    // El ViewSet es singleton, así que usamos el endpoint sin ID o con el método PUT/PATCH directo
    // Primero obtenemos la configuración para obtener el ID
    const config = await this.getConfiguracion()
    return this.patch<any>(`/core/configuracion/${config.id}/`, data);
  }
}

// Crear instancia única del servicio
const apiService = new ApiService();

// Exportar tanto como named export como default
export const api = apiService;
export default apiService;

