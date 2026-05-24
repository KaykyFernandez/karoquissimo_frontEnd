import { api } from './api';

export const parcelasService = {
  list: (params?: Record<string, unknown>) => api.get('/parcelas', { params }).then(r => r.data),
  pagar: (id: number) => api.patch(`/parcelas/${id}/pagar`).then(r => r.data),
};
