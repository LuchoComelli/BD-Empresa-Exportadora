// frontend/src/services/registro.ts

import api from './api';
import type {
  SolicitudRegistroRequest,
  SolicitudRegistroResponse,
  EstadoSolicitud,
} from '@/types/registro';

/**
 * Servicio para el sistema de registro público de empresas
 */
export const registroService = {
  /**
   * Enviar solicitud de registro de empresa
   */
  registrarEmpresa: async (data: SolicitudRegistroRequest) => {
    const response = await api.post<SolicitudRegistroResponse>(
      '/registro/',
      data
    );
    return response.data;
  },

  /**
   * Confirmar email con token
   */
  confirmarEmail: async (token: string) => {
    const response = await api.get(`/registro/confirmar/${token}/`);
    return response.data;
  },

  /**
   * Obtener estado de una solicitud
   */
  obtenerEstado: async (solicitudId: number) => {
    const response = await api.get<EstadoSolicitud>(
      `/registro/estado/${solicitudId}/`
    );
    return response.data;
  },

  /**
   * Subir documento adicional a una solicitud
   */
  subirDocumento: async (solicitudId: number, formData: FormData) => {
    const response = await api.post(
      `/registro/documento/${solicitudId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default registroService;