import { api } from './api';

export interface Produto {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  category: { id: number; name: string };
  color: string;
  size: string;
  price: string;
  units: number;
  supplier: string;
  expirationDate?: string;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria { id: number; name: string; }

export const produtosService = {
  list: (q?: string, categoryId?: number) =>
    api.get<Produto[]>('/produtos', { params: { ...(q && { q }), ...(categoryId && { categoryId }) } }).then(r => r.data),
  getOne: (id: number) =>
    api.get<Produto>(`/produtos/${id}`).then(r => r.data),
  create: (data: unknown) =>
    api.post<Produto>('/produtos', data).then(r => r.data),
  update: (id: number, data: unknown) =>
    api.put<Produto>(`/produtos/${id}`, data).then(r => r.data),
  ajustarEstoque: (id: number, data: { type: string; quantity: number; reason: string }) =>
    api.patch(`/produtos/${id}/estoque`, data).then(r => r.data),
};

export const categoriasService = {
  list: () => api.get<Categoria[]>('/categorias').then(r => r.data),
  create: (name: string) => api.post<Categoria>('/categorias', { name }).then(r => r.data),
  remove: (id: number) => api.delete(`/categorias/${id}`).then(r => r.data),
};
