import { api } from '../../services/api';

export interface PushStats {
  total: number;
  porApp: Array<{ appId: string; total: number }>;
  porPerfil: Array<{ perfil: string; total: number }>;
}

export interface SendPushPayload {
  appId: string;
  roles: string[];
  tema: string;
  titulo: string;
  mensaje: string;
  facultades?: string[];
  ciEspecifico?: string;
  tipoEstudiante?: string;
}

export interface SendPushResponse {
  success: boolean;
  totalDispositivos: number;
  enviados: number;
  message: string;
}

export const notificationsService = {
  getStats: async (): Promise<PushStats> => {
    return await api.get('admin/notifications/stats');
  },
  sendNotification: async (payload: SendPushPayload): Promise<SendPushResponse> => {
    return await api.post('admin/notifications/send', payload);
  },
};
