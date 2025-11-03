// frontend/src/services/empresas.ts

import api from './api';
import type {
  Empresaproducto,
  Empresaservicio,
  EmpresaMixta,
  EmpresaListItem,
  EmpresaFilters,
  EmpresaEstadisticas,
  EmpresaCreateRequest,
  EmpresaUpdateRequest,
  TipoEmpresa,
  Rubro,
  UnidadMedida,
  ProductoEmpresa,
  ServicioEmpresa,
  MatrizClasificacionExportador,
} from '@/types/empresa';

/**
 * Servicio para Empresas de Producto
 */
export const empresasProductoService = {
  /**
   * Obtener todas las empresas de producto (con filtros)
   */
  getAll: async (filters?: EmpresaFilters) => {
    const response = await api.get<EmpresaListItem[]>('/empresas-producto/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener una empresa de producto por ID
   */
  getById: async (id: number) => {
    const response = await api.get<Empresaproducto>(`/empresas-producto/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva empresa de producto
   */
  create: async (data: EmpresaCreateRequest) => {
    const response = await api.post<Empresaproducto>('/empresas-producto/', data);
    return response.data;
  },

  /**
   * Actualizar una empresa de producto
   */
  update: async (id: number, data: EmpresaUpdateRequest) => {
    const response = await api.patch<Empresaproducto>(`/empresas-producto/${id}/`, data);
    return response.data;
  },

  /**
   * Actualizar completamente una empresa de producto
   */
  replace: async (id: number, data: EmpresaCreateRequest) => {
    const response = await api.put<Empresaproducto>(`/empresas-producto/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una empresa de producto
   */
  delete: async (id: number) => {
    await api.delete(`/empresas-producto/${id}/`);
  },

  /**
   * Obtener solo empresas exportadoras
   */
  getExportadoras: async () => {
    const response = await api.get<EmpresaListItem[]>('/empresas-producto/exportadoras/');
    return response.data;
  },

  /**
   * Obtener estadísticas de empresas de producto
   */
  getEstadisticas: async () => {
    const response = await api.get<EmpresaEstadisticas>('/empresas-producto/estadisticas/');
    return response.data;
  },
};

/**
 * Servicio para Empresas de Servicio
 */
export const empresasServicioService = {
  /**
   * Obtener todas las empresas de servicio (con filtros)
   */
  getAll: async (filters?: EmpresaFilters) => {
    const response = await api.get<EmpresaListItem[]>('/empresas-servicio/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener una empresa de servicio por ID
   */
  getById: async (id: number) => {
    const response = await api.get<Empresaservicio>(`/empresas-servicio/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva empresa de servicio
   */
  create: async (data: EmpresaCreateRequest) => {
    const response = await api.post<Empresaservicio>('/empresas-servicio/', data);
    return response.data;
  },

  /**
   * Actualizar una empresa de servicio
   */
  update: async (id: number, data: EmpresaUpdateRequest) => {
    const response = await api.patch<Empresaservicio>(`/empresas-servicio/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una empresa de servicio
   */
  delete: async (id: number) => {
    await api.delete(`/empresas-servicio/${id}/`);
  },
};

/**
 * Servicio para Empresas Mixtas
 */
export const empresasMixtaService = {
  /**
   * Obtener todas las empresas mixtas (con filtros)
   */
  getAll: async (filters?: EmpresaFilters) => {
    const response = await api.get<EmpresaListItem[]>('/empresas-mixta/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener una empresa mixta por ID
   */
  getById: async (id: number) => {
    const response = await api.get<EmpresaMixta>(`/empresas-mixta/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva empresa mixta
   */
  create: async (data: EmpresaCreateRequest) => {
    const response = await api.post<EmpresaMixta>('/empresas-mixta/', data);
    return response.data;
  },

  /**
   * Actualizar una empresa mixta
   */
  update: async (id: number, data: EmpresaUpdateRequest) => {
    const response = await api.patch<EmpresaMixta>(`/empresas-mixta/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una empresa mixta
   */
  delete: async (id: number) => {
    await api.delete(`/empresas-mixta/${id}/`);
  },
};

/**
 * Servicio para Catálogos (Tipos de Empresa, Rubros, etc.)
 */
export const catalogosService = {
  /**
   * Obtener tipos de empresa
   */
  getTiposEmpresa: async () => {
    const response = await api.get<TipoEmpresa[]>('/tipos-empresa/');
    return response.data;
  },

  /**
   * Obtener rubros
   */
  getRubros: async (tipo?: string) => {
    const response = await api.get<Rubro[]>('/rubros/', {
      params: tipo ? { tipo } : undefined,
    });
    return response.data;
  },

  /**
   * Obtener unidades de medida
   */
  getUnidadesMedida: async () => {
    const response = await api.get<UnidadMedida[]>('/unidades-medida/');
    return response.data;
  },
};

/**
 * Servicio para Productos de Empresa
 */
export const productosService = {
  /**
   * Obtener productos de una empresa
   */
  getByEmpresa: async (empresaId: number) => {
    const response = await api.get<ProductoEmpresa[]>('/productos/', {
      params: { empresa: empresaId },
    });
    return response.data;
  },

  /**
   * Crear un producto
   */
  create: async (data: Omit<ProductoEmpresa, 'id' | 'posicion_arancelaria'>) => {
    const response = await api.post<ProductoEmpresa>('/productos/', data);
    return response.data;
  },

  /**
   * Actualizar un producto
   */
  update: async (id: number, data: Partial<ProductoEmpresa>) => {
    const response = await api.patch<ProductoEmpresa>(`/productos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un producto
   */
  delete: async (id: number) => {
    await api.delete(`/productos/${id}/`);
  },
};

/**
 * Servicio para Servicios de Empresa
 */
export const serviciosService = {
  /**
   * Obtener servicios de una empresa
   */
  getByEmpresa: async (empresaId: number) => {
    const response = await api.get<ServicioEmpresa[]>('/servicios/', {
      params: { empresa: empresaId },
    });
    return response.data;
  },

  /**
   * Crear un servicio
   */
  create: async (data: Omit<ServicioEmpresa, 'id'>) => {
    const response = await api.post<ServicioEmpresa>('/servicios/', data);
    return response.data;
  },

  /**
   * Actualizar un servicio
   */
  update: async (id: number, data: Partial<ServicioEmpresa>) => {
    const response = await api.patch<ServicioEmpresa>(`/servicios/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un servicio
   */
  delete: async (id: number) => {
    await api.delete(`/servicios/${id}/`);
  },
};

/**
 * Servicio para Matriz de Clasificación
 */
export const matrizClasificacionService = {
  /**
   * Obtener todas las clasificaciones
   */
  getAll: async (filters?: {
    categoria?: string;
    empresa_producto?: number;
    empresa_servicio?: number;
    empresa_mixta?: number;
  }) => {
    const response = await api.get<MatrizClasificacionExportador[]>('/matriz-clasificacion/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener una clasificación por ID
   */
  getById: async (id: number) => {
    const response = await api.get<MatrizClasificacionExportador>(`/matriz-clasificacion/${id}/`);
    return response.data;
  },

  /**
   * Crear una clasificación
   */
  create: async (data: Omit<MatrizClasificacionExportador, 'id' | 'puntaje_total' | 'categoria' | 'fecha_evaluacion'>) => {
    const response = await api.post<MatrizClasificacionExportador>('/matriz-clasificacion/', data);
    return response.data;
  },

  /**
   * Actualizar una clasificación
   */
  update: async (id: number, data: Partial<MatrizClasificacionExportador>) => {
    const response = await api.patch<MatrizClasificacionExportador>(`/matriz-clasificacion/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una clasificación
   */
  delete: async (id: number) => {
    await api.delete(`/matriz-clasificacion/${id}/`);
  },
};

/**
 * Servicio unificado que detecta automáticamente el tipo de empresa
 */
export const empresasService = {
  /**
   * Obtener todas las empresas (de todos los tipos)
   * Nota: Esto requeriría hacer 3 requests o crear un endpoint unificado en el backend
   */
  getAll: async (filters?: EmpresaFilters) => {
    const [productos, servicios, mixtas] = await Promise.all([
      empresasProductoService.getAll(filters),
      empresasServicioService.getAll(filters),
      empresasMixtaService.getAll(filters),
    ]);
    
    return [...productos, ...servicios, ...mixtas];
  },

  /**
   * Obtener empresa por ID y tipo
   */
  getById: async (id: number, tipo: 'producto' | 'servicio' | 'mixta') => {
    switch (tipo) {
      case 'producto':
        return empresasProductoService.getById(id);
      case 'servicio':
        return empresasServicioService.getById(id);
      case 'mixta':
        return empresasMixtaService.getById(id);
      default:
        throw new Error('Tipo de empresa no válido');
    }
  },

  /**
   * Eliminar empresa por ID y tipo
   */
  delete: async (id: number, tipo: 'producto' | 'servicio' | 'mixta') => {
    switch (tipo) {
      case 'producto':
        return empresasProductoService.delete(id);
      case 'servicio':
        return empresasServicioService.delete(id);
      case 'mixta':
        return empresasMixtaService.delete(id);
      default:
        throw new Error('Tipo de empresa no válido');
    }
  },
};

// Exportar todo por defecto
export default {
  producto: empresasProductoService,
  servicio: empresasServicioService,
  mixta: empresasMixtaService,
  catalogos: catalogosService,
  productos: productosService,
  servicios: serviciosService,
  matriz: matrizClasificacionService,
  unified: empresasService,
};