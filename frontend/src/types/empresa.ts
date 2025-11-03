// frontend/src/types/empresa.ts

/**
 * Tipos base para empresas
 */

export type TipoEmpresa = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
};

export type Rubro = {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'producto' | 'servicio' | 'mixto' | 'otro';
  unidad_medida_estandar: 'tn' | 'kg' | 'lts' | 'u' | 'na';
  activo: boolean;
  orden: number;
};

export type UnidadMedida = {
  id: number;
  nombre: string;
  simbolo: string;
  tipo: 'peso' | 'volumen' | 'longitud' | 'unidad' | 'otro';
  activo: boolean;
};

// Categoría de clasificación exportadora
export type CategoriaExportadora = 
  | 'exportadora' 
  | 'potencial_exportadora' 
  | 'etapa_inicial';

export type CategoriaExportadoraDisplay = 
  | 'Exportadora' 
  | 'Potencial Exportadora' 
  | 'Etapa Inicial';

/**
 * Base común para todas las empresas
 */
export interface EmpresaBase {
  id: number;
  
  // Información básica
  razon_social: string;
  cuit_cuil: string;
  direccion: string;
  
  // Ubicación
  departamento: number;
  departamento_nombre?: string;
  municipio?: number | null;
  municipio_nombre?: string;
  localidad?: number | null;
  localidad_nombre?: string;
  geolocalizacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  
  // Contacto
  telefono?: string | null;
  correo?: string | null;
  sitioweb?: string | null;
  email_secundario?: string | null;
  email_terciario?: string | null;
  
  // Contacto Principal (OBLIGATORIO)
  contacto_principal_nombre: string;
  contacto_principal_cargo: string;
  contacto_principal_telefono: string;
  contacto_principal_email: string;
  
  // Contacto Secundario (OPCIONAL)
  contacto_secundario_nombre?: string | null;
  contacto_secundario_cargo?: string | null;
  contacto_secundario_telefono?: string | null;
  contacto_secundario_email?: string | null;
  
  // Exportación
  exporta?: 'Sí' | 'No, solo ventas nacionales' | 'No, solo ventas locales' | null;
  destinoexporta?: string | null;
  tipoexporta?: 'Directa' | 'Terceros' | 'Mixta' | null;
  interes_exportar?: boolean | null;
  
  // Importación
  importa?: boolean | null;
  tipoimporta?: string | null;
  otrasimportaciones?: string | null;
  frecuenciaimporta?: 'Mensual' | 'Anual' | 'Ocasional' | 'Nunca' | null;
  
  // Certificaciones
  certificadopyme?: boolean | null;
  certificacionesbool?: boolean | null;
  certificaciones?: string | null;
  certificaciones_otros?: string | null;
  archivo_certificaciones?: string | null;
  archivo_certificaciones_nombre?: string | null;
  
  // Promoción
  promo2idiomas?: boolean | null;
  idiomas_trabaja?: string | null;
  
  // Capacidad productiva
  capacidadproductiva?: number | null;
  tiempocapacidad?: 'Mensual' | 'Anual' | 'Semanal' | null;
  otracapacidad?: string | null;
  
  // Redes sociales
  redes_sociales?: string | null;
  
  // Ferias
  participoferianacional?: boolean | null;
  feriasnacionales?: string | null;
  participoferiainternacional?: boolean | null;
  feriasinternacionales?: string | null;
  archivo_ferias?: string | null;
  archivo_ferias_nombre?: string | null;
  
  // Archivos adicionales
  logo?: string | null;
  brochure?: string | null;
  descripcion?: string | null;
  observaciones?: string | null;
  puntaje?: number | null;
  
  // Relaciones
  id_usuario: number;
  id_rubro: number;
  rubro_nombre?: string;
  tipo_empresa: number;
  tipo_empresa_nombre?: string;
  
  // Timestamps
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/**
 * Producto de empresa
 */
export interface ProductoEmpresa {
  id: number;
  empresa: number;
  nombre_producto: string;
  descripcion: string;
  capacidad_productiva?: number | null;
  unidad_medida: 'kg' | 'tn' | 'lt' | 'm3' | 'un' | 'otro';
  periodo_capacidad: 'mensual' | 'anual' | 'semanal';
  es_principal: boolean;
  precio_estimado?: number | null;
  moneda_precio: 'ARS' | 'USD' | 'EUR';
  posicion_arancelaria?: PosicionArancelaria;
}

/**
 * Servicio de empresa
 */
export interface ServicioEmpresa {
  id: number;
  empresa: number;
  nombre_servicio: string;
  descripcion: string;
  tipo_servicio: 
    | 'consultoria' 
    | 'tecnologias' 
    | 'diseno_marketing' 
    | 'capacitacion'
    | 'culturales_eventos'
    | 'investigacion_desarrollo'
    | 'turismo_receptivo'
    | 'otro';
  tipo_servicio_otro?: string | null;
  sector_atendido: 'mineria' | 'agroindustria' | 'turismo' | 'comercio' | 'salud' | 'pymes' | 'otro';
  sector_otro?: string | null;
  alcance_servicio: 'local' | 'nacional' | 'internacional';
  paises_trabaja?: string | null;
  exporta_servicios?: boolean | null;
  interes_exportar_servicios?: boolean | null;
  idiomas_trabajo?: string | null;
  idioma_otro?: string | null;
  forma_contratacion: 'hora' | 'proyecto' | 'mensual' | 'otro';
  forma_contratacion_otro?: string | null;
  certificaciones_tecnicas?: string | null;
  tiene_equipo_tecnico?: boolean | null;
  equipo_tecnico_formacion?: boolean | null;
  es_principal: boolean;
}

/**
 * Posición Arancelaria
 */
export interface PosicionArancelaria {
  id: number;
  producto: number;
  codigo_arancelario: string;
  descripcion_arancelaria?: string | null;
}

/**
 * Empresa de Producto (hereda de EmpresaBase)
 */
export interface Empresaproducto extends EmpresaBase {
  productos?: ProductoEmpresa[];
  tipo_empresa_detalle?: TipoEmpresa;
  rubro_detalle?: Rubro;
}

/**
 * Empresa de Servicio (hereda de EmpresaBase)
 */
export interface Empresaservicio extends EmpresaBase {
  servicios?: ServicioEmpresa[];
  tipo_empresa_detalle?: TipoEmpresa;
  rubro_detalle?: Rubro;
}

/**
 * Empresa Mixta (hereda de EmpresaBase)
 */
export interface EmpresaMixta extends EmpresaBase {
  productos?: ProductoEmpresa[];
  servicios?: ServicioEmpresa[];
  tipo_empresa_detalle?: TipoEmpresa;
  rubro_detalle?: Rubro;
}

/**
 * Serializers simplificados para listas
 */
export interface EmpresaListItem {
  id: number;
  razon_social: string;
  cuit_cuil: string;
  direccion: string;
  departamento_nombre: string;
  telefono?: string | null;
  correo?: string | null;
  tipo_empresa_nombre: string;
  rubro_nombre: string;
  exporta?: string | null;
  importa?: boolean | null;
  fecha_creacion: string;
}

/**
 * Matriz de Clasificación Exportadora
 */
export interface MatrizClasificacionExportador {
  id: number;
  empresa_producto?: number | null;
  empresa_servicio?: number | null;
  empresa_mixta?: number | null;
  
  // Criterios (0-3 puntos cada uno)
  experiencia_exportadora: 0 | 1 | 2 | 3;
  volumen_produccion: 0 | 1 | 2 | 3;
  presencia_digital: 0 | 1 | 2 | 3;
  posicion_arancelaria: 0 | 1 | 2 | 3;
  participacion_internacionalizacion: 0 | 1 | 2 | 3;
  estructura_interna: 0 | 1 | 2 | 3;
  interes_exportador: 0 | 1 | 2 | 3;
  certificaciones_nacionales: 0 | 1 | 2 | 3;
  certificaciones_internacionales: 0 | 1 | 2 | 3;
  
  // Resultado
  puntaje_total: number;
  categoria: CategoriaExportadora;
  fecha_evaluacion: string;
  evaluado_por?: number | null;
  observaciones?: string | null;
}

/**
 * Filtros para listado de empresas
 */
export interface EmpresaFilters {
  search?: string;
  exporta?: string;
  importa?: boolean;
  certificadopyme?: boolean;
  tipo_empresa?: number;
  id_rubro?: number;
  departamento?: number;
  categoria?: CategoriaExportadora;
}

/**
 * Estadísticas de empresas
 */
export interface EmpresaEstadisticas {
  total: number;
  exportadoras: number;
  importadoras: number;
  con_certificado_pyme: number;
  con_certificaciones: number;
}

/**
 * Request/Response types
 */
export interface EmpresaCreateRequest extends Omit<EmpresaBase, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

export interface EmpresaUpdateRequest extends Partial<EmpresaCreateRequest> {}

/**
 * Helper para convertir categoria de API a Display
 */
export const getCategoriaDisplay = (categoria: CategoriaExportadora): CategoriaExportadoraDisplay => {
  const map: Record<CategoriaExportadora, CategoriaExportadoraDisplay> = {
    'exportadora': 'Exportadora',
    'potencial_exportadora': 'Potencial Exportadora',
    'etapa_inicial': 'Etapa Inicial'
  };
  return map[categoria];
};

/**
 * Helper para colores de categoría
 */
export const getCategoriaColor = (categoria: CategoriaExportadora | CategoriaExportadoraDisplay): string => {
  const normalized = typeof categoria === 'string' && categoria.includes('Exportadora') 
    ? categoria 
    : getCategoriaDisplay(categoria as CategoriaExportadora);
    
  switch (normalized) {
    case 'Exportadora':
      return 'bg-[#C3C840] text-[#222A59]';
    case 'Potencial Exportadora':
      return 'bg-[#F59E0B] text-white';
    case 'Etapa Inicial':
      return 'bg-[#629BD2] text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};