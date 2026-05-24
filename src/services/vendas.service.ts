import { api } from './api';

export const vendasService = {
  list: (params?: Record<string, unknown>) => api.get('/vendas', { params }).then(r => r.data),
  getOne: (id: number) => api.get(`/vendas/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/vendas', data).then(r => r.data),
};
