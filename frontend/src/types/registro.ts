// frontend/src/types/registro.ts

/**
 * Tipos para el sistema de registro de empresas
 */

export interface ContactoRegistro {
  id?: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}

export interface ProductoRegistro {
  id?: string;
  nombre: string;
  posicionArancelaria: string;
  descripcion: string;
  capacidadProductiva: string;
}

export interface ActividadPromocion {
  id?: string;
  tipo: 'feria' | 'mision' | 'ronda';
  lugar: string;
  anio: string;
}

export interface RegistroEmpresaFormData {
  // Paso 1: Información Básica
  rubro: string;
  subRubro: string;
  razonSocial: string;
  cuit: string;
  productos: ProductoRegistro[];

  // Paso 2: Contacto y Ubicación
  contactoPrincipal: ContactoRegistro;
  contactosSecundarios: ContactoRegistro[];
  direccion: string;
  provincia: string;
  departamento: string;
  municipio: string;
  localidad: string;
  paginaWeb: string;
  geolocalizacion: string;

  // Paso 3: Actividad Comercial
  exporta: 'si' | 'no' | 'en-proceso' | '';
  destinoExportacion: string;
  importa: 'si' | 'no' | '';
  materialPromocion: 'si' | 'no' | 'en-desarrollo' | '';
  actividadesPromocion: ActividadPromocion[];
  observaciones: string;

  // Paso 4: Certificaciones
  certificadoMiPyme: 'si' | 'vencido' | 'en-tramite' | 'no' | '';
  certificaciones: string;
}

/**
 * Request que se envía al backend
 */
export interface SolicitudRegistroRequest {
  // Información básica
  razon_social: string;
  cuit_cuil: string;
  direccion: string;

  // Ubicación
  departamento: string;
  municipio?: string;
  localidad?: string;

  // Contacto
  telefono: string;
  correo: string;
  sitioweb?: string;

  // Información de la empresa
  tipo_empresa: 'producto' | 'servicio' | 'mixta';
  rubro_principal: string;
  descripcion_actividad: string;

  // Exportación/Importación
  exporta: boolean;
  destino_exportacion?: string;
  importa: boolean;
  tipo_importacion?: string;

  // Certificaciones
  certificado_pyme: boolean;
  certificaciones?: string;

  // Promoción
  material_promocional_idiomas: boolean;
  idiomas_trabajo?: string;

  // Contacto principal
  nombre_contacto: string;
  cargo_contacto: string;
  telefono_contacto: string;
  email_contacto: string;

  // Datos adicionales (JSON)
  productos?: string; // JSON stringified
  contactos_adicionales?: string; // JSON stringified
  actividades_promocion?: string; // JSON stringified
  geolocalizacion?: string;
}

/**
 * Response del backend
 */
export interface SolicitudRegistroResponse {
  id: number;
  razon_social: string;
  cuit_cuil: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision';
  token_confirmacion: string;
  email_confirmado: boolean;
  fecha_creacion: string;
  mensaje?: string;
}

/**
 * Estado de la solicitud
 */
export interface EstadoSolicitud {
  id: number;
  razon_social: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision';
  fecha_creacion: string;
  fecha_aprobacion?: string;
  observaciones_admin?: string;
  email_confirmado: boolean;
}

/**
 * Helper para convertir datos del formulario a request
 */
export function convertirFormDataARequest(
  formData: RegistroEmpresaFormData
): SolicitudRegistroRequest {
  // Determinar tipo de empresa (por ahora asumimos 'producto')
  const tipoEmpresa: 'producto' | 'servicio' | 'mixta' = 'producto';

  // Construir descripción de actividad desde productos
  const descripcionActividad = formData.productos
    .map((p) => `${p.nombre}: ${p.descripcion}`)
    .join('\n\n');

  return {
    razon_social: formData.razonSocial,
    cuit_cuil: formData.cuit.replace(/\D/g, ''), // Remover caracteres no numéricos
    direccion: formData.direccion,

    departamento: formData.departamento,
    municipio: formData.municipio || undefined,
    localidad: formData.localidad || undefined,

    telefono: formData.contactoPrincipal.telefono,
    correo: formData.contactoPrincipal.email,
    sitioweb: formData.paginaWeb || undefined,

    tipo_empresa: tipoEmpresa,
    rubro_principal: `${formData.rubro} - ${formData.subRubro}`,
    descripcion_actividad: descripcionActividad,

    exporta: formData.exporta === 'si',
    destino_exportacion: formData.exporta === 'si' ? formData.destinoExportacion : undefined,
    importa: formData.importa === 'si',
    tipo_importacion: undefined,

    certificado_pyme: formData.certificadoMiPyme === 'si' || formData.certificadoMiPyme === 'vencido',
    certificaciones: formData.certificaciones || undefined,

    material_promocional_idiomas: formData.materialPromocion === 'si',
    idiomas_trabajo: undefined,

    nombre_contacto: formData.contactoPrincipal.nombre,
    cargo_contacto: formData.contactoPrincipal.cargo,
    telefono_contacto: formData.contactoPrincipal.telefono,
    email_contacto: formData.contactoPrincipal.email,

    // Datos adicionales como JSON
    productos: JSON.stringify(formData.productos),
    contactos_adicionales: JSON.stringify(formData.contactosSecundarios),
    actividades_promocion: JSON.stringify(formData.actividadesPromocion),
    geolocalizacion: formData.geolocalizacion || undefined,
  };
}