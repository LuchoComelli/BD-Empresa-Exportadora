// Tipos para autenticación
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario | null;
  is_active: boolean;
  is_staff: boolean;
  telefono?: string;
  avatar?: string;
}

export interface RolUsuario {
  id: number;
  nombre: string;
  descripcion: string;
  nivel_acceso: number;
  puede_crear_empresas: boolean;
  puede_editar_empresas: boolean;
  puede_eliminar_empresas: boolean;
  puede_ver_auditoria: boolean;
}

// Tipos para ubicación
export interface Departamento {
  id: number;
  coddpto: string;
  nomdpto: string;
  codprov: string;
  activo: boolean;
}

export interface Municipio {
  id: number;
  codmun: string;
  nommun: string;
  coddpto: string;
  codprov: string;
  dpto: number;
  dpto_nombre: string;
  activo: boolean;
}

export interface Localidad {
  id: number;
  codloc: string;
  nomloc: string;
  municipio: number;
  municipio_nombre: string;
  dpto_nombre: string;
  latitud: string;
  longitud: string;
  activo: boolean;
}

// Tipos para empresas
export interface TipoEmpresa {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Rubro {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'producto' | 'servicio' | 'mixto' | 'otro';
  unidad_medida_estandar: string;
  activo: boolean;
}

export interface EmpresaBase {
  id: number;
  razon_social: string;
  cuit_cuil: string;
  direccion: string;
  departamento: number;
  departamento_nombre?: string;
  municipio?: number;
  municipio_nombre?: string;
  localidad?: number;
  telefono?: string;
  correo?: string;
  sitioweb?: string;
  exporta?: string;
  importa?: boolean;
  tipo_empresa: number;
  tipo_empresa_nombre?: string;
  id_rubro: number;
  rubro_nombre?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EmpresaProducto extends EmpresaBase {
  productos: ProductoEmpresa[];
}

export interface EmpresaServicio extends EmpresaBase {
  servicios: ServicioEmpresa[];
}

export interface EmpresaMixta extends EmpresaBase {
  productos: ProductoEmpresaMixta[];
  servicios: ServicioEmpresaMixta[];
}

export interface ProductoEmpresa {
  id: number;
  empresa: number;
  nombre_producto: string;
  descripcion: string;
  capacidad_productiva?: number;
  unidad_medida: string;
  periodo_capacidad: string;
  es_principal: boolean;
  precio_estimado?: number;
  moneda_precio: string;
}

export interface ServicioEmpresa {
  id: number;
  empresa: number;
  nombre_servicio: string;
  descripcion: string;
  tipo_servicio: string;
  sector_atendido: string;
  alcance_servicio: string;
  exporta_servicios?: boolean;
  es_principal: boolean;
}

export interface ProductoEmpresaMixta {
  id: number;
  empresa: number;
  nombre_producto: string;
  descripcion: string;
  capacidad_productiva?: number;
  unidad_medida: string;
  periodo_capacidad: string;
  es_principal: boolean;
}

export interface ServicioEmpresaMixta {
  id: number;
  empresa: number;
  nombre_servicio: string;
  descripcion: string;
  tipo_servicio: string;
  sector_atendido: string;
  alcance_servicio: string;
  exporta_servicios?: boolean;
  es_principal: boolean;
}

// Tipos para solicitudes de registro
export interface SolicitudRegistro {
  id: number;
  razon_social: string;
  cuit_cuil: string;
  tipo_empresa: 'producto' | 'servicio' | 'mixta';
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  correo: string;
  telefono: string;
  departamento: string;
  municipio?: string;
  localidad?: string;
  fecha_solicitud: string;
  email_confirmado: boolean;
  fecha_confirmacion?: string;
}

// Tipos para paginación
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface EmpresaFormData {
  razon_social: string;
  cuit_cuil: string;
  direccion: string;
  departamento: number;
  municipio?: number;
  localidad?: number;
  telefono?: string;
  correo?: string;
  sitioweb?: string;
  tipo_empresa: number;
  id_rubro: number;
  exporta?: string;
  importa?: boolean;
  contacto_principal_nombre: string;
  contacto_principal_cargo: string;
  contacto_principal_telefono: string;
  contacto_principal_email: string;
}

