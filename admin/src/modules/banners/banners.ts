import { api, apiFetch } from '../../services/api';

export interface BannerItem {
  id: number;
  titulo: string | null;
  imagenUrl: string;
  enlaceRedireccion: string | null;
  activo: boolean;
  createdAt: string;
}

export const bannersService = {
  getAll: async (): Promise<BannerItem[]> => {
    const res = await api.get('admin/banners');
    return res.data;
  },
  create: async (formData: FormData): Promise<{ success: boolean; data: any }> => {
    return await apiFetch('admin/banners', {
      method: 'POST',
      body: formData,
    });
  },
  toggleActive: async (id: number, activo: boolean): Promise<{ success: boolean; data: any }> => {
    return await api.put(`admin/banners/${id}/toggle`, { activo });
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return await api.delete(`admin/banners/${id}`);
  },
};
